import {
  VoucherFormCatalogState,
  VoucherFormDateValue,
  VoucherFormNullableDateValue,
  VoucherFormPayload,
} from "src/types/voucher-form";

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

  return catalogs.voucherTypes.find((voucherType) => {
    return voucherType.name.trim().toLowerCase() === normalizedValue;
  })?.id;
}

export function resolveParsedVoucherLetterId(
  parsedVoucherLetter: string | null | undefined,
  catalogs: VoucherFormCatalogState,
): string | undefined {
  const normalizedValue = normalizeParsedVoucherValue(parsedVoucherLetter);

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
