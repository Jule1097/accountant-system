import { NextResponse } from "next/server"

const authNoStoreHeader = "no-store, max-age=0"

function copyResponseCookies(source: NextResponse, target: NextResponse): void {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })
}

export function createAuthJsonResponse(
  response: NextResponse,
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const headers = new Headers(init?.headers)
  headers.set("Cache-Control", authNoStoreHeader)

  const nextResponse = NextResponse.json(body, {
    ...init,
    headers,
  })

  copyResponseCookies(response, nextResponse)

  return nextResponse
}

export function resolveAuthErrorResponse(message: string, response: NextResponse): NextResponse {
  if (message === "Datos inválidos") {
    return createAuthJsonResponse(response, { error: message }, { status: 400 })
  }

  if (message === "Credenciales inválidas. Por favor verifique e intente nuevamente.") {
    return createAuthJsonResponse(response, { error: message }, { status: 401 })
  }

  return createAuthJsonResponse(response, { error: "Error interno del servidor" }, { status: 500 })
}
