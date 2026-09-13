import { voucherTypeApplicabilityValues } from "src/lib/constants/voucher"
import { VoucherRecordType } from "src/types/voucher/voucher"

export type VoucherTypeApplicability = typeof voucherTypeApplicabilityValues[keyof typeof voucherTypeApplicabilityValues]

export interface ApplicableVoucherType {
  id: string
  name: string
  applicability?: VoucherTypeApplicability
}

export function filterVoucherTypesByApplicability<T extends ApplicableVoucherType>(voucherTypes: T[], flow: VoucherRecordType): T[] {
  return voucherTypes.filter((voucherType) => !voucherType.applicability || voucherType.applicability === voucherTypeApplicabilityValues.both || voucherType.applicability === flow)
}
