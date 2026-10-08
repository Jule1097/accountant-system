import type { VoucherSchemaOutput } from "src/lib/schemas/voucher/voucher-schemas"
import type { VoucherFactoryInput } from "src/types/voucher/domain"
import { formatCanonicalDate } from "src/lib/helpers/platform/canonical-date"

export function mapVoucherSchemaToDomainInput(input: VoucherSchemaOutput): VoucherFactoryInput {
  return { ...input, date: formatCanonicalDate(input.date), accountingPeriod: input.accountingPeriod ? formatCanonicalDate(input.accountingPeriod) : null, paymentDate: input.paymentDate ? formatCanonicalDate(input.paymentDate) : null }
}
