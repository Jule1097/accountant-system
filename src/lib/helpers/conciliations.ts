import { ParserBatchItemContextRecord, ParserBatchRecord, ParserBatchStatus, ParserVoucherType } from "src/types/parser-batch";
import {
  ConciliationItem,
  ConciliationSectionData,
  ConciliationsPageData,
  ConciliationsQueryState,
  ConciliationSectionKey,
  ConciliationTab,
  ConciliationVisibleStatus,
} from "src/types/conciliations";
import { GeminiParserResponse } from "src/types/gemini-parser";

const itemsPerPage = 4;

export function resolveConciliationTab(voucherType: ParserBatchRecord["voucherType"]): ConciliationTab {
  if (voucherType === "sale") {
    return "sales";
  }

  return "purchases";
}

export function resolveVoucherType(tab: ConciliationTab): ParserVoucherType {
  if (tab === "sales") {
    return "sale";
  }

  return "purchase";
}

export function isDiscardableStatus(status: ParserBatchItemContextRecord["status"]): boolean {
  return status === "parsed"
    || status === "validated"
    || status === "failed"
    || status === "duplicate";
}

function resolveVisibleStatus(item: ParserBatchItemContextRecord): ConciliationVisibleStatus {
  if (item.status === "queued" || item.status === "processing") {
    return "Procesando";
  }

  if (item.status === "validated") {
    return "Validada";
  }

  if (item.status === "failed") {
    return "Error";
  }

  if (item.status === "duplicate") {
    return "Duplicada";
  }

  if (!hasReviewableParsedPayload(item.parsedPayload)) {
    return "Error";
  }

  return "Lista";
}

function resolveStatusPriority(status: ConciliationVisibleStatus): number {
  if (status === "Procesando") {
    return 0;
  }

  if (status === "Lista") {
    return 1;
  }

  if (status === "Validada") {
    return 2;
  }

  if (status === "Duplicada") {
    return 3;
  }

  return 4;
}

function formatDocumentSegment(value: string | null, size: number): string {
  if (!value) {
    return "0".repeat(size);
  }

  return value.padStart(size, "0");
}

function resolveDocumentId(payload: GeminiParserResponse | null): string {
  if (!payload) {
    return "Comprobante sin identificar";
  }

  const voucherLetter = payload.voucherLetter?.trim();
  const posNumber = formatDocumentSegment(payload.posNumber, 5);
  const number = formatDocumentSegment(payload.number, 8);

  if (!voucherLetter) {
    return `${posNumber}-${number}`;
  }

  return `${voucherLetter} ${posNumber}-${number}`;
}

function resolveThirdPartyName(payload: GeminiParserResponse | null): string | null {
  return payload?.thirdPartyName || null;
}

function resolveAmount(payload: GeminiParserResponse | null): number | null {
  return typeof payload?.totalAmount === "number" ? payload.totalAmount : null;
}

function resolveCurrency(payload: GeminiParserResponse | null): string | null {
  return payload?.currency || null;
}

function hasMeaningfulNumber(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return /[1-9]/.test(value);
}

function hasMeaningfulText(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue || normalizedValue === "null") {
    return false;
  }

  return normalizedValue !== "sin tercero identificado";
}

function hasMeaningfulTaxItems(items: Array<{ amount: number | null }>): boolean {
  return items.some((item) => typeof item.amount === "number" && item.amount > 0);
}

function hasMeaningfulVatDetails(
  items: Array<{ subtotal: number | null; vatAmount: number | null }>
): boolean {
  return items.some((item) => {
    return (typeof item.subtotal === "number" && item.subtotal > 0)
      || (typeof item.vatAmount === "number" && item.vatAmount > 0);
  });
}

function hasReviewableParsedPayload(payload: GeminiParserResponse | null): boolean {
  if (!payload) {
    return false;
  }

  return !!(
    (hasMeaningfulNumber(payload.posNumber) && hasMeaningfulNumber(payload.number))
    || hasMeaningfulText(payload.date)
    || (typeof payload.totalAmount === "number" && payload.totalAmount > 0)
    || hasMeaningfulText(payload.thirdPartyCuit)
    || hasMeaningfulText(payload.thirdPartyName)
    || hasMeaningfulVatDetails(payload.vatDetails)
    || hasMeaningfulTaxItems(payload.retentions)
    || hasMeaningfulTaxItems(payload.perceptions)
  );
}

function resolveMessage(item: ParserBatchItemContextRecord, visibleStatus: ConciliationVisibleStatus): string {
  if (visibleStatus === "Procesando") {
    return "La factura se está procesando.";
  }

  if (visibleStatus === "Error") {
    return item.currentError || "No se pudo extraer información suficiente de la factura.";
  }

  if (visibleStatus === "Duplicada") {
    return "La factura ya existe en la base de datos.";
  }

  if (visibleStatus === "Validada") {
    return "La factura fue validada y está lista para guardarse.";
  }

  return "La factura está lista para revisión.";
}

function mapConciliationItem(item: ParserBatchItemContextRecord): ConciliationItem {
  const parsedPayload = item.parsedPayload;
  const visibleStatus = resolveVisibleStatus(item);
  const canDiscard = visibleStatus === "Lista"
    || visibleStatus === "Validada"
    || visibleStatus === "Duplicada"
    || visibleStatus === "Error";

  return {
    id: item.id,
    batchId: item.batch.id,
    type: resolveConciliationTab(item.batch.voucherType),
    documentId: resolveDocumentId(parsedPayload),
    date: parsedPayload?.date || null,
    thirdParty: resolveThirdPartyName(parsedPayload),
    amount: resolveAmount(parsedPayload),
    currency: resolveCurrency(parsedPayload),
    status: visibleStatus,
    message: resolveMessage(item, visibleStatus),
    canReview: visibleStatus === "Lista",
    canRetry: visibleStatus === "Error",
    canDiscard,
  };
}

function sortParserItems(items: ParserBatchItemContextRecord[]): ParserBatchItemContextRecord[] {
  return [...items].sort((leftItem, rightItem) => {
    const leftStatus = resolveVisibleStatus(leftItem);
    const rightStatus = resolveVisibleStatus(rightItem);
    const statusDifference = resolveStatusPriority(leftStatus) - resolveStatusPriority(rightStatus);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const rightUpdatedAt = new Date(rightItem.updatedAt).getTime();
    const leftUpdatedAt = new Date(leftItem.updatedAt).getTime();
    const updatedDifference = rightUpdatedAt - leftUpdatedAt;

    if (updatedDifference !== 0) {
      return updatedDifference;
    }

    return leftItem.id.localeCompare(rightItem.id);
  });
}

function buildSectionData(
  title: string,
  key: ConciliationSectionKey,
  items: ConciliationItem[],
  totalCount: number,
  hasMore: boolean,
): ConciliationSectionData {
  return {
    key,
    title,
    items,
    totalCount,
    hasMore,
  };
}

function buildAuxiliarySection(
  key: ConciliationSectionKey,
  title: string,
  items: ConciliationItem[],
): ConciliationSectionData | null {
  if (items.length === 0) {
    return null;
  }

  return buildSectionData(
    title,
    key,
    items,
    items.length,
    false,
  );
}

function buildReadySection(
  items: ConciliationItem[],
  totalCount: number,
): ConciliationSectionData | null {
  if (items.length === 0) {
    return null;
  }

  return buildSectionData(
    "Listas para revisar",
    "ready",
    items,
    totalCount,
    false,
  );
}

function compactSections(sections: Array<ConciliationSectionData | null>): ConciliationSectionData[] {
  return sections.filter((section): section is ConciliationSectionData => section !== null);
}

export function getConciliationsItemsPerPage(): number {
  return itemsPerPage;
}

export function buildConciliationsPageData(
  query: ConciliationsQueryState,
  items: ParserBatchItemContextRecord[]
): ConciliationsPageData {
  const sortedItems = sortParserItems(items);
  const groupedItems = sortedItems.reduce<Record<ConciliationVisibleStatus, ConciliationItem[]>>((currentValue, item) => {
    const visibleStatus = resolveVisibleStatus(item);
    const nextValue = currentValue[visibleStatus] || [];

    return {
      ...currentValue,
      [visibleStatus]: [...nextValue, mapConciliationItem(item)],
    };
  }, {
    Procesando: [],
    Lista: [],
    Validada: [],
    Duplicada: [],
    Error: [],
  });
  const readyItems = groupedItems.Lista;
  const totalCount = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(readyItems.length / itemsPerPage));
  const currentPage = Math.min(query.page, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReadyItems = readyItems.slice(startIndex, startIndex + itemsPerPage);
  const sections = compactSections([
    buildAuxiliarySection("processing", "Procesando", groupedItems.Procesando),
    buildReadySection(paginatedReadyItems, readyItems.length),
    buildAuxiliarySection("validated", "Validadas", groupedItems.Validada),
    buildAuxiliarySection("duplicate", "Duplicadas", groupedItems.Duplicada),
    buildAuxiliarySection("error", "Error", groupedItems.Error),
  ]);

  return {
    sections,
    totalCount,
    processingCount: groupedItems.Procesando.length,
    readyCount: readyItems.length,
    validatedCount: groupedItems.Validada.length,
    totalPages,
    currentPage,
    startIndex,
  };
}

export function isParserBatchTerminal(status: ParserBatchStatus): boolean {
  return status === "completed" || status === "partial" || status === "expired";
}
