import { Money } from "src/models/voucher/Money"
import { IncompatibleCurrencyError } from "src/lib/errors/voucher/voucher-errors"
import { getFormattedAmount } from "src/lib/helpers/platform/formatting"

describe("Money", () => {
  it("rounds values to two decimals using half-up rounding", () => {
    const money = new Money("10.005", "ARS")

    expect(money.toString()).toBe("10.01")
  })

  it("performs precise addition and subtraction without binary floating-point errors", () => {
    const firstAmount = new Money("0.10", "ARS")
    const secondAmount = new Money("0.20", "ARS")

    expect(firstAmount.add(secondAmount).toString()).toBe("0.30")
    expect(firstAmount.add(secondAmount).subtract(new Money("0.10", "ARS")).toString()).toBe("0.20")
  })

  it("rounds multiplication results to two decimals", () => {
    const money = new Money("100.00", "ARS")

    expect(money.multiply("1.125").toString()).toBe("112.50")
  })

  it("rejects arithmetic between incompatible currencies", () => {
    expect(() => new Money("10.00", "ARS").add(new Money("1.00", "USD"))).toThrow(IncompatibleCurrencyError)
  })

  it("serializes canonical currency and amount as a decimal string", () => {
    const money = new Money("1250.5", "ARS")

    expect(money.toJSON()).toEqual({ amount: "1250.50", currency: "ARS" })
  })

  it("formats canonical ARS values for the Argentine frontend view", () => {
    expect(getFormattedAmount("ARS", 1250.5)).toBe("$ 1.250,50")
    expect(getFormattedAmount("USD", 1250.5)).toBe("USD 1.250,50")
  })
})
