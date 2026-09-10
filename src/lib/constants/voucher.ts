export const voucherCurrencyCodes = {
  ars: "ARS",
  usd: "USD",
} as const

export const voucherCurrencySymbols = {
  ARS: "$",
  USD: "USD",
} as const

export const voucherMoneyScale = 2
export const voucherMoneyPrecision = 15
export const voucherMoneyMaximum = 10 ** (voucherMoneyPrecision - voucherMoneyScale) - 10 ** -voucherMoneyScale
export const voucherExchangeRateScale = 4
export const voucherExchangeRatePrecision = 12
export const voucherExchangeRateMaximum = 10 ** (voucherExchangeRatePrecision - voucherExchangeRateScale) - 10 ** -voucherExchangeRateScale
export const voucherNegativeMultiplier = "-1"
export const voucherZeroAmount = "0"
export const voucherDefaultExchangeRate = "1"
export const voucherDefaultAccountingPeriodDay = "01"
export const voucherTypeValues = { sale: "sale", purchase: "purchase" } as const
export const voucherTypeCategories = { standard: "standard", creditNote: "credit_note" } as const
export const voucherCreditNoteNameTokens = ["credito", "crédito", "crÃ©dito"] as const
export const voucherStatusValues = { pending: "pending", partial: "partial", paid: "paid" } as const
export const voucherPageSizeOptions = [10, 20, 50] as const
export const voucherTaxJurisdictionConceptToken = "ingresos brutos"
export const voucherTaxJurisdictionRequiredMessage = "La jurisdicción es obligatoria para Ingresos Brutos"

export const voucherMoneyErrorMessages = {
  invalidAmount: "Money amount must be a valid decimal string",
  missingCurrency: "Money currency is required",
  incompatibleCurrencies: (leftCurrency: string, rightCurrency: string) => `Cannot operate on ${leftCurrency} and ${rightCurrency} amounts`,
  unsupportedType: (type: string) => `Unsupported voucher type: ${type}`,
  missingSaleClient: "Sale vouchers require a client",
  missingPurchaseSupplier: "Purchase vouchers require a supplier",
  salePerceptions: "Sale vouchers cannot contain perceptions",
  purchaseRetentions: "Purchase vouchers cannot contain retentions",
  missingCompany: "Voucher company is required",
  invalidDate: "Voucher date must be valid",
  missingVoucherCurrency: "Voucher currency is required",
  missingRetentionConcept: "Retention concept is required",
  missingPerceptionConcept: "Perception concept is required",
  missingVatRate: "VAT rate is required",
  missingVoucherInput: "Voucher input is required",
  missingVoucherDate: "Voucher date is required",
} as const

export const voucherValidationMessages = {
  invalidFiniteAmount: "El monto debe ser un número finito.",
  excessiveAmount: "El monto supera el máximo permitido.",
  excessiveAmountScale: "El monto puede tener hasta 2 decimales.",
  invalidFiniteExchangeRate: "El tipo de cambio debe ser un número finito.",
  excessiveExchangeRate: "El tipo de cambio supera el máximo permitido.",
  excessiveExchangeRateScale: "El tipo de cambio puede tener hasta 4 decimales.",
} as const
