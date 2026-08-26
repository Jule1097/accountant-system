export function getFormattedAmount(currency: string, value: number): string {
  const currencyLabel = currency === "USD" ? "USD" : "$";
  return `${currencyLabel} ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getFormattedDate(value?: string | null): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("es-AR", { timeZone: "UTC" });
}
