import {
  VoucherFormCatalogState,
  VoucherFormDateValue,
  VoucherFormNullableDateValue,
  VoucherFormPayload,
} from "src/types/voucher/voucher-form";
import { resolveGeminiCatalogMatch } from "src/lib/helpers/parser/gemini-parser";

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
