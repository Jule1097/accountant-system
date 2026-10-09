export interface VoucherCalculationInput {
  type: "sale" | "purchase"
  subtotal: number
  vatAmount: number
  nonTaxableAmount: number
  exemptAmount: number
  retentions: number[]
  perceptions: number[]
}

export interface VoucherCalculatedAmounts {
  grossAmount: number
  netAmount: number
}
