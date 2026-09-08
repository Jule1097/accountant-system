import { requestContextErrorCodes } from "src/lib/constants/auth"
import { RequestContextError } from "src/lib/errors/request-context"
import { resolveRequestContextError } from "src/lib/helpers/auth/request-context-response"

describe("request context response", () => {
  it.each([
    [requestContextErrorCodes.unauthenticated, 401, "Sesión inválida."],
    [requestContextErrorCodes.companyRequired, 400, "Falta la empresa activa"],
    [requestContextErrorCodes.companyForbidden, 403, "No tienes acceso a la empresa activa."],
  ])("maps %s to its HTTP response", async (code, status, message) => {
    const response = resolveRequestContextError(new RequestContextError(code))

    expect(response).not.toBeNull()
    expect(response?.status).toBe(status)
    await expect(response?.json()).resolves.toEqual({ error: message })
  })

  it("ignores unrelated errors", () => {
    expect(resolveRequestContextError(new Error("other"))).toBeNull()
  })
})
