import Decimal from "decimal.js"
import { voucherCurrencyCodes, voucherMoneyErrorMessages, voucherMoneyScale, voucherZeroAmount } from "src/lib/constants/voucher"
import { MoneyContract } from "src/types/voucher/money"

function assertDecimalString(value: string): void {
  if (!/^-?\d+(?:\.\d+)?$/.test(value.trim())) throw new Error(voucherMoneyErrorMessages.invalidAmount)
}

function toDecimal(value: string): Decimal {
  assertDecimalString(value)
  return new Decimal(value)
}

export function normalizeMoneyAmount(value: string): string {
  return normalizeScaledDecimal(value, voucherMoneyScale)
}

export function normalizeScaledDecimal(value: string | number, scale: number): string {
  const normalizedValue = value.toString().trim()
  assertDecimalString(normalizedValue)
  return toDecimal(normalizedValue).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toFixed(scale)
}

export function addMoneyAmounts(leftAmount: string, rightAmount: string): string {
  return normalizeMoneyAmount(toDecimal(leftAmount).plus(toDecimal(rightAmount)).toString())
}

export function subtractMoneyAmounts(leftAmount: string, rightAmount: string): string {
  return normalizeMoneyAmount(toDecimal(leftAmount).minus(toDecimal(rightAmount)).toString())
}

export function multiplyMoneyAmount(amount: string, multiplier: string): string {
  return normalizeMoneyAmount(toDecimal(amount).times(toDecimal(multiplier)).toString())
}

export function normalizeOptionalMoneyAmount(value: string | number | null | undefined): string {
  return value === null || value === undefined ? voucherZeroAmount : value.toString()
}

export function sumMoneyAmounts(amounts: readonly { amount: string | number }[], initialAmount: MoneyContract, createAmount: (amount: string) => MoneyContract): MoneyContract {
  return amounts.reduce((total, item) => total.add(createAmount(item.amount.toString())), initialAmount)
}

export function normalizeMoneyCurrency(currency: string): string {
  const normalizedCurrency = currency.trim().toUpperCase()
  if (!normalizedCurrency) throw new Error(voucherMoneyErrorMessages.missingCurrency)
  return normalizedCurrency === "$" ? voucherCurrencyCodes.ars : normalizedCurrency
}
