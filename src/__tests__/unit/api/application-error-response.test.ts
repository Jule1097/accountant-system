import { applicationErrorCodes } from "src/lib/constants/application-error"
import { httpStatusCodes } from "src/lib/constants/http"
import { ApplicationError } from "src/lib/errors/application-error"
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response"

describe("application error response", () => {
  const request = new Request("http://localhost/api/vouchers/voucher-1")

  it.each([
    [applicationErrorCodes.validation, "Datos invÃ¡lidos", httpStatusCodes.badRequest],
    [applicationErrorCodes.unauthenticated, "SesiÃ³n invÃ¡lida.", httpStatusCodes.unauthorized],
    [applicationErrorCodes.forbidden, "No tienes acceso a la empresa activa.", httpStatusCodes.forbidden],
    [applicationErrorCodes.notFound, "Comprobante no encontrado.", httpStatusCodes.notFound],
    [applicationErrorCodes.duplicate, "Comprobante duplicado detectado.", httpStatusCodes.conflict],
  ])("maps %s to its public response", async (code, message, status) => {
    const response = resolveApplicationErrorResponse(new ApplicationError(code, message), { request, operation: "update voucher", entityId: "voucher-1" })

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ error: message })
  })

  it("does not expose unexpected error details and logs safe context", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation()

    const response = resolveApplicationErrorResponse(new Error("database password leaked"), { request, operation: "update voucher", entityId: "voucher-1" })

    expect(response.status).toBe(httpStatusCodes.internalServerError)
    await expect(response.json()).resolves.toEqual({ error: "Error interno del servidor" })
    expect(consoleError).toHaveBeenCalledWith("Application request failed", expect.objectContaining({ path: "/api/vouchers/voucher-1", operation: "update voucher", entityId: "voucher-1", errorName: "Error" }))

    consoleError.mockRestore()
  })

  it("logs typed unexpected failures before returning the generic response", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation()
    const response = resolveApplicationErrorResponse(new ApplicationError(applicationErrorCodes.unexpected, "Error interno del servidor", "Database operation failed"), { request, operation: "load voucher", entityId: "voucher-1" })

    expect(response.status).toBe(httpStatusCodes.internalServerError)
    expect(consoleError).toHaveBeenCalledWith("Application request failed", expect.objectContaining({ errorCode: applicationErrorCodes.unexpected, operation: "load voucher" }))

    consoleError.mockRestore()
  })
})
