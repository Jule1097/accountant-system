import { NextResponse } from "next/server"
import { requestContextErrorCodes, requestContextErrorMessages } from "src/lib/constants/auth"
import { httpStatusCodes } from "src/lib/constants/http"
import { isRequestContextError } from "src/lib/errors/request-context"

const requestContextErrorStatuses = {
  [requestContextErrorCodes.unauthenticated]: httpStatusCodes.unauthorized,
  [requestContextErrorCodes.companyRequired]: httpStatusCodes.badRequest,
  [requestContextErrorCodes.companyForbidden]: httpStatusCodes.forbidden,
} as const

export function resolveRequestContextError(error: unknown): NextResponse | null {
  if (!isRequestContextError(error)) return null
  const messages = {
    [requestContextErrorCodes.unauthenticated]: requestContextErrorMessages.unauthenticated,
    [requestContextErrorCodes.companyRequired]: requestContextErrorMessages.companyRequired,
    [requestContextErrorCodes.companyForbidden]: requestContextErrorMessages.companyForbidden,
  }
  return NextResponse.json({ error: messages[error.code] }, { status: requestContextErrorStatuses[error.code] })
}
