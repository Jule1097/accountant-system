import { voucherZeroAmount } from "src/lib/constants/voucher"
import { normalizeOptionalMoneyAmount, sumMoneyAmounts } from "src/lib/helpers/voucher/money"
import { validatePurchaseInvariants } from "src/lib/helpers/voucher/voucher-invariants"
import { Money } from "src/models/voucher/Money"
import { Voucher } from "src/models/voucher/Voucher"
import { PurchaseVoucherInput, VoucherPartySnapshot, VoucherTaxAmountInput } from "src/types/voucher/domain"
import type { VoucherPersistenceData, VoucherParty, VoucherVisitor } from "src/types/voucher/voucher-operations"

export class Purchase extends Voucher {
  readonly supplierId: string | null
  readonly supplier: VoucherPartySnapshot | null
  readonly perceptions: readonly VoucherTaxAmountInput[]

  constructor(input: PurchaseVoucherInput, rehydrate = false) {
    super(input)
    this.supplierId = input.supplierId ?? null
    this.supplier = input.supplier ?? null
    this.perceptions = input.perceptions
    validatePurchaseInvariants(input)
    if (rehydrate) this.rehydrate()
    if (!rehydrate) this.recalculate()
  }

  calculateTotalAmount(): Money {
    const perceptions = sumMoneyAmounts(this.perceptions, new Money(voucherZeroAmount, this.currency), (amount) => new Money(normalizeOptionalMoneyAmount(amount), this.currency))
    this.totalAmount = this.baseTotal().add(perceptions)
    return this.totalAmount
  }

  calculateNetAmount(): Money {
    this.netAmount = this.totalAmount
    return this.netAmount
  }

  accept<TResult>(visitor: VoucherVisitor<TResult>): TResult {
    return visitor.visitPurchase(this)
  }

  getParty(): VoucherParty {
    return this.supplier
  }

  getPersistenceData(): VoucherPersistenceData {
    return { clientId: null, supplierId: this.supplierId, duplicateCriteria: { supplierId: this.supplierId }, retentions: [], perceptions: this.perceptions }
  }

  getPartyId(): string | null {
    return this.supplierId
  }
}
