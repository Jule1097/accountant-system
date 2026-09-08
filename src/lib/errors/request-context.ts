import { requestContextErrorCodes, RequestContextErrorCode } from "src/lib/constants/auth"
import { isError } from "src/lib/helpers/shared/type-guards"

export class RequestContextError extends Error {
  constructor(public readonly code: RequestContextErrorCode) {
    super(code)
    this.name = "RequestContextError"
  }
}

export function isRequestContextError(value: unknown): value is RequestContextError {
  if (!isError(value) || value.name !== "RequestContextError" || !("code" in value) || typeof value.code !== "string") return false
  return Object.values(requestContextErrorCodes).includes(value.code as RequestContextErrorCode)
}
