import type { VoucherSchemaOutput } from "src/lib/schemas/voucher/voucher-schemas"
import type { VoucherFactoryInput } from "src/types/voucher/domain"

export function mapVoucherSchemaToDomainInput(input: VoucherSchemaOutput): VoucherFactoryInput {
  return { ...input, date: input.date.toISOString(), accountingPeriod: input.accountingPeriod?.toISOString() ?? null, paymentDate: input.paymentDate?.toISOString() ?? null }
}
