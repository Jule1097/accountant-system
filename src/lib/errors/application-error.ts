import { applicationErrorCodes, applicationErrorInternalMessages, ApplicationErrorCode } from "src/lib/constants/application-error"
import { isError } from "src/lib/helpers/shared/type-guards"

export class ApplicationError extends Error {
  public readonly diagnosticMessage: string

  constructor(public readonly code: ApplicationErrorCode, public readonly publicMessage: string, internalMessage: string = applicationErrorInternalMessages.operationFailed) {
    super(publicMessage)
    this.diagnosticMessage = internalMessage
    this.name = "ApplicationError"
  }
}

export function isApplicationError(value: unknown): value is ApplicationError {
  if (!isError(value) || value.name !== "ApplicationError" || !("code" in value) || !("publicMessage" in value) || typeof value.code !== "string" || typeof value.publicMessage !== "string") return false
  return Object.values(applicationErrorCodes).includes(value.code as ApplicationErrorCode)
}
