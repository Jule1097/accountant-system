import { voucherCreditNoteNameTokens, voucherMoneyScale } from "src/lib/constants/voucher";
import { analyticsDefaultCurrency } from "src/lib/constants/analytics";

const localizedDecimalFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: voucherMoneyScale,
  maximumFractionDigits: voucherMoneyScale,
});

function isCreditNoteVoucherType(voucherTypeName?: string | null): boolean {
  const normalizedName = voucherTypeName?.toLowerCase() || "";
  return voucherCreditNoteNameTokens.some((token) => normalizedName.includes(token));
}

export function getFormattedAmount(currency: string, value: number, voucherTypeName?: string | null): string {
  const currencyLabel = currency === analyticsDefaultCurrency || currency === "$" ? "$" : currency;
  const signedValue = isCreditNoteVoucherType(voucherTypeName) ? -Math.abs(value) : value;
  return `${currencyLabel} ${signedValue.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatLocalizedDecimal(value: number | null | undefined): string {
  return localizedDecimalFormatter.format(Number.isFinite(value) ? value ?? 0 : 0);
}

export function parseLocalizedDecimal(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? roundToTwoDecimals(value) : 0;
  if (!value) return 0;

  const normalizedValue = value.trim().replace(/\s/g, "");
  if (!normalizedValue) return 0;

  const normalizedDecimal = normalizedValue.includes(",")
    ? normalizedValue.replace(/\./g, "").replace(",", ".")
    : normalizedValue.split(".").slice(1).every((part) => part.length === voucherMoneyScale + 1)
      ? normalizedValue.replace(/\./g, "")
      : normalizedValue;
  const parsedValue = Number(normalizedDecimal);

  return Number.isFinite(parsedValue) ? roundToTwoDecimals(parsedValue) : 0;
}

export function getFormattedDate(value?: string | Date | null): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
