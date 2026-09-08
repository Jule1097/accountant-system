import { voucherZeroAmount } from "src/lib/constants/voucher"
import { normalizeOptionalMoneyAmount, sumMoneyAmounts } from "src/lib/helpers/voucher/money"
import { validateSaleInvariants } from "src/lib/helpers/voucher/voucher-invariants"
import { Money } from "src/models/voucher/Money"
import { Voucher } from "src/models/voucher/Voucher"
import { SaleVoucherInput, VoucherPartySnapshot, VoucherTaxAmountInput } from "src/types/voucher/domain"
import type { VoucherPersistenceData, VoucherParty, VoucherVisitor } from "src/types/voucher/voucher-operations"

export class Sale extends Voucher {
  readonly clientId: string | null
  readonly client: VoucherPartySnapshot | null
  readonly retentions: readonly VoucherTaxAmountInput[]

  static resolveSubtotalFromTaxIncludedTotal(totalAmount: Money, vatAmount: Money): Money {
    const subtotal = totalAmount.subtract(vatAmount)
    return Number(subtotal.toString()) < 0 ? new Money(voucherZeroAmount, totalAmount.currency) : subtotal
  }

  constructor(input: SaleVoucherInput, rehydrate = false) {
    super(input)
    this.clientId = input.clientId ?? null
    this.client = input.client ?? null
    this.retentions = input.retentions
    validateSaleInvariants(input)
    if (rehydrate) this.rehydrate()
    if (!rehydrate) this.recalculate()
  }

  calculateTotalAmount(): Money {
    this.totalAmount = this.baseTotal()
    return this.totalAmount
  }

  calculateNetAmount(): Money {
    const retentions = sumMoneyAmounts(this.retentions, new Money(voucherZeroAmount, this.currency), (amount) => new Money(normalizeOptionalMoneyAmount(amount), this.currency))
    this.netAmount = this.totalAmount.subtract(retentions)
    return this.netAmount
  }

  accept<TResult>(visitor: VoucherVisitor<TResult>): TResult {
    return visitor.visitSale(this)
  }

  getParty(): VoucherParty {
    return this.client
  }

  getPersistenceData(): VoucherPersistenceData {
    return { clientId: this.clientId, supplierId: null, duplicateCriteria: { clientId: this.clientId }, retentions: this.retentions, perceptions: [] }
  }

  getPartyId(): string | null {
    return this.clientId
  }
}
