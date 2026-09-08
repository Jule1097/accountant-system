import { voucherExchangeRateScale } from "src/lib/constants/voucher"
import { normalizeScaledDecimal } from "src/lib/helpers/voucher/money"
import { VoucherAmountInput } from "src/types/voucher/domain"

export class ExchangeRate {
  private readonly value: string

  constructor(value: VoucherAmountInput) {
    this.value = normalizeScaledDecimal(value, voucherExchangeRateScale)
  }

  toString(): string {
    return this.value
  }
}
