import { voucherMoneyErrorMessages } from "src/lib/constants/voucher"
import { isError } from "src/lib/helpers/shared/type-guards"

export const voucherDomainErrorCodes = {
  invalid: "INVALID_VOUCHER",
  unsupportedType: "UNSUPPORTED_VOUCHER_TYPE",
  incompatibleCurrency: "INCOMPATIBLE_CURRENCY",
} as const

export type VoucherDomainErrorCode = typeof voucherDomainErrorCodes[keyof typeof voucherDomainErrorCodes]

export class InvalidVoucherError extends Error {
  readonly code = voucherDomainErrorCodes.invalid

  constructor(message: string) {
    super(message)
    this.name = "InvalidVoucherError"
  }
}

export class UnsupportedVoucherTypeError extends Error {
  readonly code = voucherDomainErrorCodes.unsupportedType

  constructor(type: string) {
    super(voucherMoneyErrorMessages.unsupportedType(type))
    this.name = "UnsupportedVoucherTypeError"
  }
}

export class IncompatibleCurrencyError extends Error {
  readonly code = voucherDomainErrorCodes.incompatibleCurrency

  constructor(leftCurrency: string, rightCurrency: string) {
    super(voucherMoneyErrorMessages.incompatibleCurrencies(leftCurrency, rightCurrency))
    this.name = "IncompatibleCurrencyError"
  }
}

export function isVoucherDomainError(value: unknown): value is Error & { code: VoucherDomainErrorCode } {
  if (!isError(value) || !("code" in value) || typeof value.code !== "string") return false
  return Object.values(voucherDomainErrorCodes).includes(value.code as VoucherDomainErrorCode)
}
