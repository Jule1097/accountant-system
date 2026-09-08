import { voucherStatusValues, voucherTypeCategories, voucherTypeValues } from "src/lib/constants/voucher"
import { CurrencyCode } from "src/types/voucher/money"

export type VoucherDomainStatus = typeof voucherStatusValues[keyof typeof voucherStatusValues]
export type VoucherTypeCategory = typeof voucherTypeCategories[keyof typeof voucherTypeCategories]
export type VoucherAmountInput = string | number

export interface VoucherTaxAmountInput {
  amount: VoucherAmountInput
  retentionConceptId?: string
  perceptionConceptId?: string
  taxJurisdictionId?: string | null
  conceptName?: string | null
  taxJurisdictionName?: string | null
}

export interface VoucherVatDetailInput {
  vatRateId?: string
  subtotal?: VoucherAmountInput
  vatAmount?: VoucherAmountInput
  amount?: VoucherAmountInput
  vatRateName?: string | null
}

export interface VoucherPartySnapshot {
  name: string
  cuit: string
}

export interface VoucherSnapshot {
  id?: string
  companyId: string
  type: string
  voucherTypeId: string
  voucherLetterId: string
  posNumber: string
  number: string
  date: string
  accountingPeriod: string
  currency: CurrencyCode
  exchangeRate: string
  subtotal: string
  vatAmount: string
  nonTaxableAmount: string
  exemptAmount: string
  otherTaxesAmount: string
  totalAmount: string
  netAmount: string
  saldo: string
  paidAmount: string
  paymentMethod: string | null
  paymentDate: string | null
  status: VoucherDomainStatus
  concept: string | null
  comments: string | null
  createdByUserId: string
}

export interface VoucherCommonInput {
  id?: string
  companyId: string
  voucherTypeId: string
  voucherTypeCategory?: VoucherTypeCategory
  voucherTypeName?: string | null
  voucherLetterId: string
  voucherLetter?: string | null
  posNumber: string
  number: string
  date: string
  accountingPeriod?: string | null
  currency: CurrencyCode
  exchangeRate: VoucherAmountInput | null
  subtotal: VoucherAmountInput
  vatAmount: VoucherAmountInput
  nonTaxableAmount?: VoucherAmountInput | null
  exemptAmount?: VoucherAmountInput | null
  otherTaxesAmount?: VoucherAmountInput | null
  totalAmount?: VoucherAmountInput | null
  netAmount?: VoucherAmountInput | null
  saldo?: VoucherAmountInput | null
  paidAmount?: VoucherAmountInput | null
  paymentMethod?: string | null
  paymentDate?: string | null
  status?: VoucherDomainStatus | null
  concept?: string | null
  comments?: string | null
  createdByUserId: string
  vatDetails: VoucherVatDetailInput[]
}

export interface SaleVoucherInput extends VoucherCommonInput {
  type: typeof voucherTypeValues.sale
  clientId: string | null
  client?: VoucherPartySnapshot | null
  retentions: VoucherTaxAmountInput[]
  perceptions: []
}

export interface PurchaseVoucherInput extends VoucherCommonInput {
  type: typeof voucherTypeValues.purchase
  supplierId: string | null
  supplier?: VoucherPartySnapshot | null
  retentions: []
  perceptions: VoucherTaxAmountInput[]
}

export type VoucherDomainInput = SaleVoucherInput | PurchaseVoucherInput

export interface VoucherFactoryInput extends VoucherCommonInput {
  type: string
  clientId?: string | null
  supplierId?: string | null
  client?: VoucherPartySnapshot | null
  supplier?: VoucherPartySnapshot | null
  retentions?: VoucherTaxAmountInput[]
  perceptions?: VoucherTaxAmountInput[]
}
