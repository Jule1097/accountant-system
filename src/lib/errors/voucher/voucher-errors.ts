import { possibleNonFiscalDuplicateMessage, purchaseIdentificationConversionMessage, voucherMoneyErrorMessages } from "src/lib/constants/voucher"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { ApplicationError } from "src/lib/errors/application-error"
import { isError } from "src/lib/helpers/shared/type-guards"

export const voucherDomainErrorCodes = {
  invalid: "INVALID_VOUCHER",
  unsupportedType: "UNSUPPORTED_VOUCHER_TYPE",
  incompatibleCurrency: "INCOMPATIBLE_CURRENCY",
} as const

export class PossibleNonFiscalDuplicateError extends ApplicationError {
  readonly requiresConfirmation = true

  constructor() {
    super(applicationErrorCodes.conflict, possibleNonFiscalDuplicateMessage, "Possible non-fiscal duplicate requires confirmation")
    this.name = "ApplicationError"
  }
}

export class IdentificationModeConversionRequiredError extends ApplicationError {
  readonly requiresConfirmation = true

  constructor() {
    super(applicationErrorCodes.conflict, purchaseIdentificationConversionMessage, "Purchase identification mode conversion requires confirmation")
    this.name = "ApplicationError"
  }
}

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
