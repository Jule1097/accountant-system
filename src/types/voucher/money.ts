export type CurrencyCode = string

export interface MoneyJsonValue {
  amount: string
  currency: CurrencyCode
}

export interface MoneyContract {
  readonly currency: CurrencyCode
  add(other: MoneyContract): MoneyContract
  subtract(other: MoneyContract): MoneyContract
  multiply(multiplier: string): MoneyContract
  toString(): string
  toJSON(): MoneyJsonValue
}
