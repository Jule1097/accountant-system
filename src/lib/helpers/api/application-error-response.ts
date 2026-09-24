import { NextResponse } from "next/server"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { applicationErrorCodes, ApplicationErrorCode } from "src/lib/constants/application-error"
import { httpStatusCodes } from "src/lib/constants/http"
import { isApplicationError } from "src/lib/errors/application-error"
import { IdentificationModeConversionRequiredError, isVoucherDomainError, PossibleNonFiscalDuplicateError } from "src/lib/errors/voucher/voucher-errors"
import { resolveRequestContextError } from "src/lib/helpers/auth/request-context-response"
import { isError } from "src/lib/helpers/shared/type-guards"

export const applicationErrorStatuses: Record<ApplicationErrorCode, number> = {
  [applicationErrorCodes.validation]: httpStatusCodes.badRequest,
  [applicationErrorCodes.unauthenticated]: httpStatusCodes.unauthorized,
  [applicationErrorCodes.forbidden]: httpStatusCodes.forbidden,
  [applicationErrorCodes.notFound]: httpStatusCodes.notFound,
  [applicationErrorCodes.duplicate]: httpStatusCodes.conflict,
  [applicationErrorCodes.conflict]: httpStatusCodes.conflict,
  [applicationErrorCodes.unexpected]: httpStatusCodes.internalServerError,
}

export interface ApplicationErrorResponseContext {
  request: Request
  operation: string
  entityId?: string
  workflow?: string
  resource?: string
  unexpectedMessage?: string
}

function logUnexpectedApplicationError(error: unknown, context: ApplicationErrorResponseContext): void {
  const errorName = isError(error) ? error.name : "UnknownError"
  const errorCode = isApplicationError(error) ? error.code : applicationErrorCodes.unexpected
  const providerErrorCode = !isApplicationError(error) && isError(error) && "code" in error && typeof error.code === "string" ? error.code : undefined
  const providerErrorStatus = !isApplicationError(error) && isError(error) && "status" in error && (typeof error.status === "string" || typeof error.status === "number") ? error.status : undefined
  console.error("Application request failed", { path: new URL(context.request.url).pathname, operation: context.operation, resource: context.resource, entityId: context.entityId, workflow: context.workflow, errorName, errorCode, providerErrorCode, providerErrorStatus })
}

export function resolveApplicationErrorResponse(error: unknown, context: ApplicationErrorResponseContext): NextResponse {
  const requestContextResponse = resolveRequestContextError(error)
  if (requestContextResponse) return requestContextResponse
  if (error instanceof PossibleNonFiscalDuplicateError || error instanceof IdentificationModeConversionRequiredError) return NextResponse.json({ error: error.publicMessage, requiresConfirmation: error.requiresConfirmation }, { status: applicationErrorStatuses[error.code] })
  if (isApplicationError(error) && error.code !== applicationErrorCodes.unexpected) return NextResponse.json({ error: error.publicMessage }, { status: applicationErrorStatuses[error.code] })
  if (isVoucherDomainError(error)) return NextResponse.json({ error: apiResponseMessages.common.invalidData }, { status: httpStatusCodes.badRequest })
  logUnexpectedApplicationError(error, context)
  const message = isApplicationError(error) ? error.publicMessage : context.unexpectedMessage ?? apiResponseMessages.common.internalServerError
  return NextResponse.json({ error: message }, { status: httpStatusCodes.internalServerError })
}
