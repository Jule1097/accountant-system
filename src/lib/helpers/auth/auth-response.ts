import { NextResponse } from "next/server"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { httpStatusCodes } from "src/lib/constants/http"
import { isApplicationError } from "src/lib/errors/application-error"
import { applicationErrorStatuses } from "src/lib/helpers/api/application-error-response"

const authNoStoreHeader = "no-store, max-age=0"

function copyResponseCookies(source: NextResponse, target: NextResponse): void {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
}

export function createAuthJsonResponse(response: NextResponse, body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers)
  headers.set("Cache-Control", authNoStoreHeader)
  const nextResponse = NextResponse.json(body, { ...init, headers })
  copyResponseCookies(response, nextResponse)
  return nextResponse
}

export function resolveAuthErrorResponse(error: unknown, response: NextResponse): NextResponse {
  if (isApplicationError(error)) return createAuthJsonResponse(response, { error: error.publicMessage }, { status: applicationErrorStatuses[error.code] })
  return createAuthJsonResponse(response, { error: apiResponseMessages.common.internalServerError }, { status: httpStatusCodes.internalServerError })
}
