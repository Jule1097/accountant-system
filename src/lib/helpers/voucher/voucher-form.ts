import {
  VoucherFormCatalogState,
  VoucherFormDateValue,
  VoucherFormNullableDateValue,
  VoucherFormPayload,
} from "src/types/voucher/voucher-form";
import { voucherTaxJurisdictionConceptToken, voucherTypeValues } from "src/lib/constants/voucher";
import { resolveGeminiCatalogMatch } from "src/lib/helpers/parser/gemini-parser";
import { roundToTwoDecimals } from "src/lib/helpers/platform/formatting";
import { resolveVoucherRecordType } from "src/lib/helpers/voucher/voucher-management";
import { Money } from "src/models/voucher/Money";
import { Sale } from "src/models/voucher/Sale";
import type { GeminiParserResolvedPerception, GeminiParserResolvedRetention, ParsedVoucherData } from "src/types/parser/gemini-parser";
import type { VoucherFormValues } from "src/lib/schemas/voucher/voucher-form-schemas";
import type { VoucherApiResponse } from "src/types/voucher/voucher-api";
import type { VoucherScreenType } from "src/types/voucher/voucher";

function uniqueVoucherOptions<T extends { id: string }>(options: T[]): T[] {
  return [...new Map(options.map((option) => [option.id, option])).values()];
}

export function requiresVoucherTaxJurisdiction(conceptName?: string | null): boolean {
  return conceptName?.toLowerCase().includes(voucherTaxJurisdictionConceptToken) ?? false;
}

export function buildVoucherViewOptions(voucher: VoucherApiResponse, type: VoucherScreenType): { catalogs: VoucherFormCatalogState; thirdParties: { id: string; name: string; cuit: string }[] } {
  const thirdParty = type === "sales" ? voucher.client : voucher.supplier;
  const thirdPartyId = type === "sales" ? voucher.clientId : voucher.supplierId;
  const recordType = type === "sales" ? voucherTypeValues.sale : voucherTypeValues.purchase;
  const retentionConcepts = uniqueVoucherOptions(voucher.retentions.flatMap((item) => {
    const name = item.conceptName || item.retentionConcept?.name;
    return item.retentionConceptId && name ? [{ id: item.retentionConceptId, name, type: recordType }] : [];
  }));
  const perceptionConcepts = uniqueVoucherOptions(voucher.perceptions.flatMap((item) => {
    const name = item.conceptName || item.perceptionConcept?.name;
    return item.perceptionConceptId && name ? [{ id: item.perceptionConceptId, name }] : [];
  }));
  const taxJurisdictions = uniqueVoucherOptions([...voucher.retentions, ...voucher.perceptions].flatMap((item) => {
    const name = item.taxJurisdictionName || item.taxJurisdiction?.name;
    return item.taxJurisdictionId && name ? [{ id: item.taxJurisdictionId, name }] : [];
  }));

  return {
    catalogs: {
      voucherTypes: voucher.voucherType ? [{ id: voucher.voucherTypeId, name: voucher.voucherType.name }] : [],
      voucherLetters: voucher.voucherLetter ? [{ id: voucher.voucherLetterId, letter: voucher.voucherLetter.letter }] : [],
      retentionConcepts,
      perceptionConcepts,
      taxJurisdictions,
    },
    thirdParties: thirdParty && thirdPartyId ? [{ id: thirdPartyId, name: thirdParty.name, cuit: thirdParty.cuit }] : [],
  };
}

export function normalizeVoucherCurrency(value?: string | null): "$" | "USD" | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toUpperCase();

  if (normalizedValue === "$" || normalizedValue === "ARS" || normalizedValue === "PESOS") {
    return "$";
  }

  if (normalizedValue === "USD" || normalizedValue === "U$D" || normalizedValue === "US$") {
    return "USD";
  }

  return null;
}

export function shouldRequireVoucherExchangeRate(currency: "$" | "USD"): boolean {
  return currency !== "$";
}

export function normalizeVoucherExchangeRate(
  currency: "$" | "USD",
  exchangeRate: number | null | undefined,
): number {
  if (!shouldRequireVoucherExchangeRate(currency)) {
    return 1;
  }

  if (typeof exchangeRate !== "number" || Number.isNaN(exchangeRate)) {
    return 0;
  }

  return exchangeRate;
}

function normalizeParsedVoucherValue(value?: string | null): string {
  if (!value) {
    return "";
  }

  return value.trim().toLowerCase();
}

function normalizeParsedCatalogValue(value?: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveExactVoucherTypeMatch(
  parsedVoucherType: string | null | undefined,
  catalogs: VoucherFormCatalogState,
): string | undefined {
  const normalizedValue = normalizeParsedCatalogValue(parsedVoucherType);
  const normalizedAliasValue = normalizedValue === "factura de credito electronica mipyme fce"
    ? "factura de credito electronica mipyme"
    : normalizedValue

  if (!normalizedValue) {
    return undefined;
  }

  return catalogs.voucherTypes.find((voucherType) => {
    const normalizedCatalogValue = normalizeParsedCatalogValue(voucherType.name)
    return normalizedCatalogValue === normalizedValue || normalizedCatalogValue === normalizedAliasValue;
  })?.id;
}

function extractVoucherLetterToken(value?: string | null): string | undefined {
  const normalizedValue = normalizeParsedCatalogValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  const tokens = normalizedValue.split(" ");
  const matchedToken = tokens.findLast((token) => {
    return ["a", "b", "c", "m"].includes(token);
  });

  return matchedToken?.toUpperCase();
}

function removeVoucherLetterToken(value?: string | null): string {
  const normalizedValue = normalizeParsedCatalogValue(value);

  if (!normalizedValue) {
    return "";
  }

  const tokens = normalizedValue.split(" ");

  if (tokens.length <= 1) {
    return normalizedValue;
  }

  const lastToken = tokens[tokens.length - 1];

  if (!["a", "b", "c", "m"].includes(lastToken)) {
    return normalizedValue;
  }

  return tokens.slice(0, -1).join(" ").trim();
}

function buildVoucherCatalogTokens(value: string): string[] {
  return normalizeParsedCatalogValue(value)
    .split(" ")
    .filter((token) => token.length > 1 && !["de"].includes(token));
}

function includesAllVoucherTokens(valueTokens: string[], catalogTokens: string[]): boolean {
  if (!catalogTokens.length) {
    return false;
  }

  return catalogTokens.every((token) => valueTokens.includes(token));
}

function resolveTolerantVoucherTypeMatch(
  parsedVoucherType: string,
  catalogs: VoucherFormCatalogState,
): string | undefined {
  const valueTokens = buildVoucherCatalogTokens(parsedVoucherType);

  if (!valueTokens.length) {
    return undefined;
  }

  const matchedTypes = catalogs.voucherTypes
    .map((voucherType) => ({
      id: voucherType.id,
      tokens: buildVoucherCatalogTokens(voucherType.name),
    }))
    .filter((voucherType) => {
      return includesAllVoucherTokens(valueTokens, voucherType.tokens);
    })
    .sort((left, right) => right.tokens.length - left.tokens.length);

  return matchedTypes[0]?.id;
}

function parseVoucherDateValue(value: VoucherFormNullableDateValue | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function serializeRequiredVoucherDate(value: VoucherFormDateValue): string {
  const parsedDate = parseVoucherDateValue(value);

  if (!parsedDate) {
    throw new Error("Validated voucher date is invalid");
  }

  return parsedDate.toISOString();
}

function serializeOptionalVoucherDate(value: VoucherFormDateValue | undefined): string | undefined {
  const parsedDate = parseVoucherDateValue(value);

  if (!parsedDate) {
    return undefined;
  }

  return parsedDate.toISOString();
}

function serializeNullableVoucherDate(value: VoucherFormNullableDateValue): string | null {
  const parsedDate = parseVoucherDateValue(value);

  if (!parsedDate) {
    return null;
  }

  return parsedDate.toISOString();
}

export function resolveParsedVoucherTypeId(
  parsedVoucherType: string | null | undefined,
  catalogs: VoucherFormCatalogState,
): string | undefined {
  const normalizedValue = normalizeParsedVoucherValue(parsedVoucherType);

  if (!normalizedValue) {
    return undefined;
  }

  const exactMatch = resolveExactVoucherTypeMatch(parsedVoucherType, catalogs);

  if (exactMatch) {
    return exactMatch;
  }

  const sanitizedValue = removeVoucherLetterToken(parsedVoucherType);
  const tokenPriorityMatch = resolveTolerantVoucherTypeMatch(sanitizedValue, catalogs);

  if (tokenPriorityMatch) {
    return tokenPriorityMatch;
  }

  return resolveGeminiCatalogMatch(sanitizedValue, catalogs.voucherTypes)?.id;
}

export function resolveParsedVoucherLetterId(
  parsedVoucherLetter: string | null | undefined,
  catalogs: VoucherFormCatalogState,
  parsedVoucherType?: string | null,
): string | undefined {
  const rawLetter = extractVoucherLetterToken(parsedVoucherLetter) || extractVoucherLetterToken(parsedVoucherType);
  const normalizedValue = normalizeParsedVoucherValue(rawLetter);

  if (!normalizedValue) {
    return undefined;
  }

  return catalogs.voucherLetters.find((voucherLetter) => {
    return voucherLetter.letter.trim().toLowerCase() === normalizedValue;
  })?.id;
}

export function normalizeVoucherFormPayload(payload: VoucherFormPayload): VoucherFormPayload {
  const accountingPeriod = serializeOptionalVoucherDate(payload.accountingPeriod);

  return {
    ...payload,
    date: serializeRequiredVoucherDate(payload.date),
    accountingPeriod,
    exchangeRate: normalizeVoucherExchangeRate(payload.currency, payload.exchangeRate),
    paymentDate: serializeNullableVoucherDate(payload.paymentDate),
  };
}

const defaultVoucherFormValues: VoucherFormValues = {
  date: "",
  voucherTypeId: "",
  voucherLetterId: "",
  posNumber: "",
  number: "",
  thirdPartyId: "",
  thirdPartyCuit: "",
  currency: "$",
  exchangeRate: 1,
  subtotal: 0,
  vatAmount: 0,
  nonTaxableAmount: 0,
  exemptAmount: 0,
  otherTaxesAmount: 0,
  totalAmount: 0,
  concept: "",
  paymentMethod: "",
  status: "pending",
  paymentDate: "",
  paidAmount: 0,
  comments: "",
  createdByUserId: "",
  retentions: [],
  perceptions: [],
};

function normalizeVoucherText(value?: string | null): string {
  if (!value) return "";
  const normalizedValue = value.trim();
  if (!normalizedValue || normalizedValue.toLowerCase() === "null") return "";
  return normalizedValue;
}

function formatVoucherFormDate(value?: string | Date | null): string {
  return value ? new Date(value).toISOString().split("T")[0] : "";
}

function normalizeOptionalVoucherText(value?: string | null): string | undefined {
  return value || undefined;
}

function normalizeOptionalVoucherDate(value?: string): string | null {
  return value || null;
}

function toVoucherFormNumber(value: unknown): number | null {
  if (typeof value === "number") return roundToTwoDecimals(value);
  if (typeof value === "string" && value) return roundToTwoDecimals(Number(value));
  return null;
}

function mapVoucherRetentionValues(items: Array<{ retentionConceptId?: string; taxJurisdictionId?: string | null; amount: string | number }>): VoucherFormValues["retentions"] {
  return items.map((item) => ({ retentionConceptId: item.retentionConceptId || "", taxJurisdictionId: item.taxJurisdictionId || "", amount: roundToTwoDecimals(typeof item.amount === "number" ? item.amount : Number(item.amount?.toString() || 0)) }));
}

function mapVoucherPerceptionValues(items: Array<{ perceptionConceptId?: string; taxJurisdictionId?: string | null; amount: string | number }>): VoucherFormValues["perceptions"] {
  return items.map((item) => ({ perceptionConceptId: item.perceptionConceptId || "", taxJurisdictionId: item.taxJurisdictionId || "", amount: roundToTwoDecimals(typeof item.amount === "number" ? item.amount : Number(item.amount?.toString() || 0)) }));
}

function resolveVoucherTaxJurisdictionId(id: string | null | undefined, conceptName?: string | null): string | null {
  return requiresVoucherTaxJurisdiction(conceptName) ? id || null : null;
}

function mapParsedVoucherRetentionValues(items: GeminiParserResolvedRetention[]): VoucherFormValues["retentions"] {
  return items.filter((item): item is GeminiParserResolvedRetention & { retentionConceptId: string; amount: number } => typeof item.retentionConceptId === "string" && typeof item.amount === "number").map((item) => ({ retentionConceptId: item.retentionConceptId, taxJurisdictionId: item.taxJurisdictionId || "", amount: roundToTwoDecimals(item.amount) }));
}

function mapParsedVoucherPerceptionValues(items: GeminiParserResolvedPerception[]): VoucherFormValues["perceptions"] {
  return items.filter((item): item is GeminiParserResolvedPerception & { perceptionConceptId: string; amount: number } => typeof item.perceptionConceptId === "string" && typeof item.amount === "number").map((item) => ({ perceptionConceptId: item.perceptionConceptId, taxJurisdictionId: item.taxJurisdictionId || "", amount: roundToTwoDecimals(item.amount) }));
}

function resolveVoucherLetterById(voucherLetterId: string, catalogs: VoucherFormCatalogState): { id: string; letter: string } | undefined {
  return catalogs.voucherLetters.find((voucherLetter) => voucherLetter.id === voucherLetterId);
}

function resolveVoucherThirdPartyId(parsedData: ParsedVoucherData, thirdParties: { id: string; cuit: string }[]): string | undefined {
  if (parsedData.thirdPartyId) return parsedData.thirdPartyId;
  if (!parsedData.thirdPartyCuit) return undefined;
  return thirdParties.find((thirdParty) => thirdParty.cuit === parsedData.thirdPartyCuit)?.id;
}

function resolveVoucherCreatedByUserId(initialVoucher?: VoucherApiResponse | null, userId?: string): string {
  return initialVoucher?.createdByUserId || userId || "";
}

export function buildVoucherFormInitialValues(initialVoucher?: VoucherApiResponse | null, userId?: string): VoucherFormValues {
  if (!initialVoucher) return { ...defaultVoucherFormValues, createdByUserId: resolveVoucherCreatedByUserId(initialVoucher, userId) };
  const currency = initialVoucher.currency === "USD" ? "USD" : "$";
  return {
    date: formatVoucherFormDate(initialVoucher.date),
    voucherTypeId: initialVoucher.voucherTypeId,
    voucherLetterId: initialVoucher.voucherLetterId,
    posNumber: initialVoucher.posNumber,
    number: initialVoucher.number,
    thirdPartyId: initialVoucher.type === "sale" ? initialVoucher.clientId || "" : initialVoucher.supplierId || "",
    thirdPartyCuit: initialVoucher.type === "sale" ? initialVoucher.client?.cuit || "" : initialVoucher.supplier?.cuit || "",
    currency,
    exchangeRate: normalizeVoucherExchangeRate(currency, Number(initialVoucher.exchangeRate || 1)),
    subtotal: roundToTwoDecimals(Number(initialVoucher.subtotal || 0)),
    vatAmount: roundToTwoDecimals(Number(initialVoucher.vatAmount || 0)),
    nonTaxableAmount: roundToTwoDecimals(Number(initialVoucher.nonTaxableAmount || 0)),
    exemptAmount: roundToTwoDecimals(Number(initialVoucher.exemptAmount || 0)),
    otherTaxesAmount: roundToTwoDecimals(Number(initialVoucher.otherTaxesAmount || 0)),
    totalAmount: roundToTwoDecimals(Number(initialVoucher.totalAmount || 0)),
    concept: normalizeVoucherText(initialVoucher.concept),
    paymentMethod: normalizeVoucherText(initialVoucher.paymentMethod),
    status: initialVoucher.status || "pending",
    paymentDate: formatVoucherFormDate(initialVoucher.paymentDate),
    paidAmount: roundToTwoDecimals(Number(initialVoucher.paidAmount || 0)),
    comments: normalizeVoucherText(initialVoucher.comments),
    createdByUserId: resolveVoucherCreatedByUserId(initialVoucher, userId),
    retentions: mapVoucherRetentionValues(initialVoucher.retentions),
    perceptions: mapVoucherPerceptionValues(initialVoucher.perceptions),
  };
}

export function resolveSalesSubtotal(type: VoucherScreenType, voucherLetterId: string, totalAmount: number, vatAmount: number, catalogs: VoucherFormCatalogState, currency: "$" | "USD" = "$"): number | null {
  if (type !== "sales" || resolveVoucherLetterById(voucherLetterId, catalogs)?.letter !== "B") return null;
  const subtotal = Sale.resolveSubtotalFromTaxIncludedTotal(new Money(totalAmount.toString(), currency), new Money(vatAmount.toString(), currency));
  return Number(subtotal.toString());
}

export function buildVoucherFormPayload(values: VoucherFormValues, type: VoucherScreenType, catalogs: VoucherFormCatalogState): VoucherFormPayload {
  const voucherApiType = resolveVoucherRecordType(type);
  const normalizedSubtotal = resolveSalesSubtotal(type, values.voucherLetterId, values.totalAmount, values.vatAmount, catalogs, values.currency);
  const retentionConceptNames = new Map(catalogs.retentionConcepts.map((concept) => [concept.id, concept.name]));
  const perceptionConceptNames = new Map(catalogs.perceptionConcepts.map((concept) => [concept.id, concept.name]));
  return {
    type: voucherApiType,
    voucherTypeId: values.voucherTypeId,
    voucherLetterId: values.voucherLetterId,
    posNumber: values.posNumber,
    number: values.number,
    clientId: voucherApiType === "sale" ? values.thirdPartyId : null,
    supplierId: voucherApiType === "purchase" ? values.thirdPartyId : null,
    date: values.date,
    currency: values.currency,
    exchangeRate: normalizeVoucherExchangeRate(values.currency, values.exchangeRate),
    subtotal: normalizedSubtotal ?? values.subtotal,
    vatAmount: values.vatAmount,
    nonTaxableAmount: values.nonTaxableAmount,
    exemptAmount: values.exemptAmount,
    otherTaxesAmount: values.otherTaxesAmount,
    totalAmount: values.totalAmount,
    concept: normalizeOptionalVoucherText(values.concept),
    paymentMethod: values.paymentMethod,
    status: values.status,
    paymentDate: normalizeOptionalVoucherDate(values.paymentDate || ""),
    paidAmount: values.paidAmount,
    comments: normalizeOptionalVoucherText(values.comments),
    createdByUserId: values.createdByUserId,
    retentions: voucherApiType === "sale" ? values.retentions.map((retention) => ({ ...retention, taxJurisdictionId: resolveVoucherTaxJurisdictionId(retention.taxJurisdictionId, retentionConceptNames.get(retention.retentionConceptId)) })) : [],
    perceptions: voucherApiType === "purchase" ? values.perceptions.map((perception) => ({ ...perception, taxJurisdictionId: resolveVoucherTaxJurisdictionId(perception.taxJurisdictionId, perceptionConceptNames.get(perception.perceptionConceptId)) })) : [],
    vatDetails: [],
  };
}

export function buildVoucherParsedPatch(parsedData: ParsedVoucherData, currentValues: VoucherFormValues, type: VoucherScreenType, catalogs: VoucherFormCatalogState, thirdParties: { id: string; cuit: string }[]): Partial<VoucherFormValues> {
  const voucherTypeId = resolveParsedVoucherTypeId(parsedData.voucherType, catalogs);
  const voucherLetterId = resolveParsedVoucherLetterId(parsedData.voucherLetter, catalogs, parsedData.voucherType);
  const thirdPartyId = resolveVoucherThirdPartyId(parsedData, thirdParties);
  const parsedCurrency = normalizeVoucherCurrency(parsedData.currency);
  const nextValues = { ...currentValues, voucherLetterId: voucherLetterId || currentValues.voucherLetterId, totalAmount: toVoucherFormNumber(parsedData.totalAmount) ?? currentValues.totalAmount, vatAmount: toVoucherFormNumber(parsedData.vatAmount) ?? currentValues.vatAmount };
  const subtotal = resolveSalesSubtotal(type, nextValues.voucherLetterId, nextValues.totalAmount, nextValues.vatAmount, catalogs, parsedCurrency || currentValues.currency);
  return {
    date: parsedData.date || currentValues.date,
    voucherTypeId: voucherTypeId || currentValues.voucherTypeId,
    voucherLetterId: voucherLetterId || currentValues.voucherLetterId,
    posNumber: parsedData.posNumber ? parsedData.posNumber.padStart(5, "0") : currentValues.posNumber,
    number: parsedData.number ? parsedData.number.padStart(8, "0") : currentValues.number,
    thirdPartyId: thirdPartyId || currentValues.thirdPartyId,
    thirdPartyCuit: parsedData.thirdPartyCuit || currentValues.thirdPartyCuit,
    currency: parsedCurrency || currentValues.currency,
    exchangeRate: parsedCurrency ? normalizeVoucherExchangeRate(parsedCurrency, toVoucherFormNumber(parsedData.exchangeRate)) : currentValues.exchangeRate,
    subtotal: subtotal ?? toVoucherFormNumber(parsedData.subtotal) ?? currentValues.subtotal,
    vatAmount: toVoucherFormNumber(parsedData.vatAmount) ?? currentValues.vatAmount,
    nonTaxableAmount: toVoucherFormNumber(parsedData.nonTaxableAmount) ?? currentValues.nonTaxableAmount,
    exemptAmount: toVoucherFormNumber(parsedData.exemptAmount) ?? currentValues.exemptAmount,
    otherTaxesAmount: toVoucherFormNumber(parsedData.otherTaxesAmount) ?? currentValues.otherTaxesAmount,
    totalAmount: toVoucherFormNumber(parsedData.totalAmount) ?? currentValues.totalAmount,
    concept: normalizeVoucherText(parsedData.concept) || currentValues.concept,
    paymentMethod: normalizeVoucherText(parsedData.paymentMethod) || currentValues.paymentMethod,
    status: parsedData.status === "pending" || parsedData.status === "partial" || parsedData.status === "paid" ? parsedData.status : currentValues.status,
    paymentDate: currentValues.paymentDate,
    paidAmount: currentValues.paidAmount,
    comments: normalizeVoucherText(parsedData.comments) || currentValues.comments,
    retentions: parsedData.retentions.length ? mapParsedVoucherRetentionValues(parsedData.retentions) : currentValues.retentions,
    perceptions: parsedData.perceptions.length ? mapParsedVoucherPerceptionValues(parsedData.perceptions) : currentValues.perceptions,
  };
}
