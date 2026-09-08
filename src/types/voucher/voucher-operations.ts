import type { Purchase } from "src/models/voucher/Purchase"
import type { Sale } from "src/models/voucher/Sale"
import type { VoucherPartySnapshot, VoucherTaxAmountInput } from "src/types/voucher/domain"

export interface VoucherVisitor<TResult> {
  visitSale(voucher: Sale): TResult
  visitPurchase(voucher: Purchase): TResult
}

export interface VoucherPersistenceData {
  clientId: string | null
  supplierId: string | null
  duplicateCriteria: VoucherDuplicateCriteria
  retentions: readonly VoucherTaxAmountInput[]
  perceptions: readonly VoucherTaxAmountInput[]
}

export interface VoucherDuplicateCriteria {
  clientId?: string | null
  supplierId?: string | null
}

export type VoucherParty = VoucherPartySnapshot | null
