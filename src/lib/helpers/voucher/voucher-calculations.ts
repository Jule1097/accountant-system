import Decimal from "decimal.js"
import { roundToTwoDecimals } from "src/lib/helpers/platform/formatting"
import { VoucherCalculatedAmounts, VoucherCalculationInput } from "src/types/voucher/voucher-calculations"

function sumAmounts(amounts: number[]): Decimal {
  return amounts.reduce((total, amount) => total.plus(amount || 0), new Decimal(0))
}

export function calculateVoucherAmounts(input: VoucherCalculationInput): VoucherCalculatedAmounts {
  const grossAmount = new Decimal(input.subtotal || 0).plus(input.vatAmount || 0).plus(input.type === "purchase" ? input.nonTaxableAmount || 0 : 0).plus(input.type === "purchase" ? input.exemptAmount || 0 : 0)
  const adjustments = input.type === "sale" ? sumAmounts(input.retentions) : sumAmounts(input.perceptions)
  const netAmount = input.type === "sale" ? grossAmount.minus(adjustments) : grossAmount.plus(adjustments)
  return { grossAmount: roundToTwoDecimals(grossAmount.toNumber()), netAmount: roundToTwoDecimals(netAmount.toNumber()) }
}
