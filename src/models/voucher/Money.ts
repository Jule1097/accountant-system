import { addMoneyAmounts, multiplyMoneyAmount, normalizeMoneyAmount, normalizeMoneyCurrency, subtractMoneyAmounts } from "src/lib/helpers/voucher/money"
import { IncompatibleCurrencyError } from "src/lib/errors/voucher/voucher-errors"
import { MoneyContract, MoneyJsonValue } from "src/types/voucher/money"

export class Money implements MoneyContract {
  private readonly amount: string
  readonly currency: string

  constructor(amount: string, currency: string) {
    this.amount = normalizeMoneyAmount(amount)
    this.currency = normalizeMoneyCurrency(currency)
  }

  private ensureCompatibleCurrency(other: MoneyContract): void {
    if (this.currency !== other.currency) throw new IncompatibleCurrencyError(this.currency, other.currency)
  }

  add(other: MoneyContract): Money {
    this.ensureCompatibleCurrency(other)
    return new Money(addMoneyAmounts(this.amount, other.toString()), this.currency)
  }

  subtract(other: MoneyContract): Money {
    this.ensureCompatibleCurrency(other)
    return new Money(subtractMoneyAmounts(this.amount, other.toString()), this.currency)
  }

  multiply(multiplier: string): Money {
    return new Money(multiplyMoneyAmount(this.amount, multiplier), this.currency)
  }

  toString(): string {
    return this.amount
  }

  toJSON(): MoneyJsonValue {
    return { amount: this.toString(), currency: this.currency }
  }
}
