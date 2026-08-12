import { VoucherFormValues } from "src/lib/schemas/voucher-form-schemas";
import { Voucher } from "src/models/Voucher";
import {
  GeminiParserResolvedPerception,
  GeminiParserResolvedRetention,
} from "src/types/gemini-parser";
import { VoucherPerception, VoucherRetention, VoucherScreenType } from "src/types/voucher";
import {
  VoucherFormCatalogState,
  VoucherFormPayload,
  VoucherParsedData,
  VoucherThirdPartyOption,
} from "src/types/voucher-form";

const defaultFormValues: VoucherFormValues = {
  date: "",
  voucherTypeId: "",
  voucherLetterId: "",
  posNumber: "",
  number: "",
  thirdPartyId: "",
  thirdPartyCuit: "",
  currency: "$",
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

function normalizeTextInput(value?: string | null): string {
  if (!value) {
    return "";
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "";
  }

  if (normalizedValue.toLowerCase() === "null") {
    return "";
  }

  return normalizedValue;
}

function formatDateValue(value?: Date | null): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
}

function normalizeOptionalText(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  return value;
}

function normalizeOptionalDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  return value;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value) {
    return Number(value);
  }

  return null;
}

function mapRetentionValues(items: VoucherRetention[]): VoucherFormValues["retentions"] {
  return items.map((item) => ({
    retentionConceptId: item.retentionConceptId || "",
    taxJurisdictionId: item.taxJurisdictionId || item.taxJurisdiction?.id || "",
    amount: typeof item.amount === "number" ? item.amount : Number(item.amount?.toString() || 0),
  }));
}

function mapPerceptionValues(items: VoucherPerception[]): VoucherFormValues["perceptions"] {
  return items.map((item) => ({
    perceptionConceptId: item.perceptionConceptId || "",
    taxJurisdictionId: item.taxJurisdictionId || item.taxJurisdiction?.id || "",
    amount: typeof item.amount === "number" ? item.amount : Number(item.amount?.toString() || 0),
  }));
}

function mapParsedRetentionValues(items: GeminiParserResolvedRetention[]): VoucherFormValues["retentions"] {
  return items
    .filter((item): item is GeminiParserResolvedRetention & { retentionConceptId: string; amount: number } => {
      return typeof item.retentionConceptId === "string" && typeof item.amount === "number";
    })
    .map((item) => ({
      retentionConceptId: item.retentionConceptId,
      taxJurisdictionId: item.taxJurisdictionId || "",
      amount: item.amount,
    }));
}

function mapParsedPerceptionValues(items: GeminiParserResolvedPerception[]): VoucherFormValues["perceptions"] {
  return items
    .filter((item): item is GeminiParserResolvedPerception & { perceptionConceptId: string; amount: number } => {
      return typeof item.perceptionConceptId === "string" && typeof item.amount === "number";
    })
    .map((item) => ({
      perceptionConceptId: item.perceptionConceptId,
      taxJurisdictionId: item.taxJurisdictionId || "",
      amount: item.amount,
    }));
}

function resolveVoucherApiType(type: VoucherScreenType): "sale" | "purchase" {
  if (type === "sales") {
    return "sale";
  }

  return "purchase";
}

function resolveVoucherLetterById(
  voucherLetterId: string,
  catalogs: VoucherFormCatalogState
): { id: string; letter: string } | undefined {
  return catalogs.voucherLetters.find((voucherLetter) => voucherLetter.id === voucherLetterId);
}

function resolveVoucherTypeId(
  parsedVoucherType: string | null,
  catalogs: VoucherFormCatalogState
): string | undefined {
  if (!parsedVoucherType) {
    return undefined;
  }

  return catalogs.voucherTypes.find((voucherType) => voucherType.name.toLowerCase() === parsedVoucherType.toLowerCase())?.id;
}

function resolveVoucherLetterId(
  parsedVoucherLetter: string | null,
  catalogs: VoucherFormCatalogState
): string | undefined {
  if (!parsedVoucherLetter) {
    return undefined;
  }

  return catalogs.voucherLetters.find((voucherLetter) => voucherLetter.letter.toUpperCase() === parsedVoucherLetter.toUpperCase())?.id;
}

function resolveThirdPartyId(
  parsedData: VoucherParsedData,
  thirdParties: VoucherThirdPartyOption[]
): string | undefined {
  if (parsedData.thirdPartyId) {
    return parsedData.thirdPartyId;
  }

  if (!parsedData.thirdPartyCuit) {
    return undefined;
  }

  return thirdParties.find((thirdParty) => thirdParty.cuit === parsedData.thirdPartyCuit)?.id;
}

function resolveCreatedByUserId(initialVoucher?: Voucher | null, userId?: string): string {
  if (initialVoucher?.createdByUserId) {
    return initialVoucher.createdByUserId;
  }

  return userId || "";
}

export class VoucherForm {
  static buildInitialValues(initialVoucher?: Voucher | null, userId?: string): VoucherFormValues {
    if (!initialVoucher) {
      return {
        ...defaultFormValues,
        createdByUserId: resolveCreatedByUserId(initialVoucher, userId),
      };
    }

    return {
      date: formatDateValue(initialVoucher.date),
      voucherTypeId: initialVoucher.voucherTypeId,
      voucherLetterId: initialVoucher.voucherLetterId,
      posNumber: initialVoucher.posNumber,
      number: initialVoucher.number,
      thirdPartyId: initialVoucher.type === "sale" ? initialVoucher.clientId || "" : initialVoucher.supplierId || "",
      thirdPartyCuit: initialVoucher.type === "sale" ? initialVoucher.client?.cuit || "" : initialVoucher.supplier?.cuit || "",
      currency: initialVoucher.currency === "USD" ? "USD" : "$",
      subtotal: Number(initialVoucher.subtotal || 0),
      vatAmount: Number(initialVoucher.vatAmount || 0),
      nonTaxableAmount: Number(initialVoucher.nonTaxableAmount || 0),
      exemptAmount: Number(initialVoucher.exemptAmount || 0),
      otherTaxesAmount: Number(initialVoucher.otherTaxesAmount || 0),
      totalAmount: Number(initialVoucher.totalAmount || 0),
      concept: normalizeTextInput(initialVoucher.concept),
      paymentMethod: normalizeTextInput(initialVoucher.paymentMethod),
      status: initialVoucher.status || "pending",
      paymentDate: formatDateValue(initialVoucher.paymentDate),
      paidAmount: Number(initialVoucher.paidAmount || 0),
      comments: normalizeTextInput(initialVoucher.comments),
      createdByUserId: resolveCreatedByUserId(initialVoucher, userId),
      retentions: mapRetentionValues(initialVoucher.retentions),
      perceptions: mapPerceptionValues(initialVoucher.perceptions),
    };
  }

  static resolveSalesSubtotal(
    type: VoucherScreenType,
    voucherLetterId: string,
    totalAmount: number,
    vatAmount: number,
    catalogs: VoucherFormCatalogState
  ): number | null {
    if (type !== "sales") {
      return null;
    }

    const voucherLetter = resolveVoucherLetterById(voucherLetterId, catalogs);

    if (!voucherLetter || voucherLetter.letter !== "B") {
      return null;
    }

    return Math.max(totalAmount - vatAmount, 0);
  }

  static buildPayload(
    values: VoucherFormValues,
    type: VoucherScreenType,
    catalogs: VoucherFormCatalogState
  ): VoucherFormPayload {
    const voucherApiType = resolveVoucherApiType(type);
    const normalizedSubtotal = this.resolveSalesSubtotal(
      type,
      values.voucherLetterId,
      values.totalAmount,
      values.vatAmount,
      catalogs
    );

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
      exchangeRate: values.currency === "USD" ? 1.0001 : 1,
      subtotal: normalizedSubtotal ?? values.subtotal,
      vatAmount: values.vatAmount,
      nonTaxableAmount: values.nonTaxableAmount,
      exemptAmount: values.exemptAmount,
      otherTaxesAmount: values.otherTaxesAmount,
      totalAmount: values.totalAmount,
      concept: normalizeOptionalText(values.concept),
      paymentMethod: values.paymentMethod,
      status: values.status,
      paymentDate: normalizeOptionalDate(values.paymentDate || ""),
      paidAmount: values.paidAmount,
      comments: normalizeOptionalText(values.comments),
      createdByUserId: values.createdByUserId,
      retentions: voucherApiType === "sale" ? values.retentions : [],
      perceptions: voucherApiType === "purchase" ? values.perceptions : [],
      vatDetails: [],
    };
  }

  static buildParsedPatch(
    parsedData: VoucherParsedData,
    currentValues: VoucherFormValues,
    type: VoucherScreenType,
    catalogs: VoucherFormCatalogState,
    thirdParties: VoucherThirdPartyOption[]
  ): Partial<VoucherFormValues> {
    const voucherTypeId = resolveVoucherTypeId(parsedData.voucherType, catalogs);
    const voucherLetterId = resolveVoucherLetterId(parsedData.voucherLetter, catalogs);
    const thirdPartyId = resolveThirdPartyId(parsedData, thirdParties);
    const nextValues = {
      ...currentValues,
      voucherLetterId: voucherLetterId || currentValues.voucherLetterId,
      totalAmount: toNumber(parsedData.totalAmount) ?? currentValues.totalAmount,
      vatAmount: toNumber(parsedData.vatAmount) ?? currentValues.vatAmount,
    };
    const subtotal = this.resolveSalesSubtotal(
      type,
      nextValues.voucherLetterId,
      nextValues.totalAmount,
      nextValues.vatAmount,
      catalogs
    );

    return {
      date: parsedData.date || currentValues.date,
      voucherTypeId: voucherTypeId || currentValues.voucherTypeId,
      voucherLetterId: voucherLetterId || currentValues.voucherLetterId,
      posNumber: parsedData.posNumber ? parsedData.posNumber.padStart(5, "0") : currentValues.posNumber,
      number: parsedData.number ? parsedData.number.padStart(8, "0") : currentValues.number,
      thirdPartyId: thirdPartyId || currentValues.thirdPartyId,
      thirdPartyCuit: parsedData.thirdPartyCuit || currentValues.thirdPartyCuit,
      currency: parsedData.currency === "USD" ? "USD" : currentValues.currency,
      subtotal: subtotal ?? toNumber(parsedData.subtotal) ?? currentValues.subtotal,
      vatAmount: toNumber(parsedData.vatAmount) ?? currentValues.vatAmount,
      nonTaxableAmount: toNumber(parsedData.nonTaxableAmount) ?? currentValues.nonTaxableAmount,
      exemptAmount: toNumber(parsedData.exemptAmount) ?? currentValues.exemptAmount,
      otherTaxesAmount: toNumber(parsedData.otherTaxesAmount) ?? currentValues.otherTaxesAmount,
      totalAmount: toNumber(parsedData.totalAmount) ?? currentValues.totalAmount,
      concept: normalizeTextInput(parsedData.concept) || currentValues.concept,
      paymentMethod: normalizeTextInput(parsedData.paymentMethod) || currentValues.paymentMethod,
      status:
        parsedData.status === "pending" || parsedData.status === "partial" || parsedData.status === "paid"
          ? parsedData.status
          : currentValues.status,
      paymentDate: currentValues.paymentDate,
      paidAmount: currentValues.paidAmount,
      comments: normalizeTextInput(parsedData.comments) || currentValues.comments,
      retentions: parsedData.retentions.length
        ? mapParsedRetentionValues(parsedData.retentions)
        : currentValues.retentions,
      perceptions: parsedData.perceptions.length
        ? mapParsedPerceptionValues(parsedData.perceptions)
        : currentValues.perceptions,
    };
  }
}
