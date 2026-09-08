export const voucherCurrencyCodes = {
  ars: "ARS",
  usd: "USD",
} as const

export const voucherCurrencySymbols = {
  ARS: "$",
  USD: "USD",
} as const

export const voucherMoneyScale = 2
export const voucherExchangeRateScale = 4
export const voucherNegativeMultiplier = "-1"
export const voucherZeroAmount = "0"
export const voucherDefaultExchangeRate = "1"
export const voucherDefaultAccountingPeriodDay = "01"
export const voucherTypeValues = { sale: "sale", purchase: "purchase" } as const
export const voucherTypeCategories = { standard: "standard", creditNote: "credit_note" } as const
export const voucherCreditNoteNameTokens = ["credito", "crédito", "crÃ©dito"] as const
export const voucherStatusValues = { pending: "pending", partial: "partial", paid: "paid" } as const
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
