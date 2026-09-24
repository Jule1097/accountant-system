import { ApiRequestError, apiRequest, resolveApiErrorMessage } from "src/lib/api/api-client"

describe("API client error messages", () => {
  it("extracts the public message from an API error payload", () => {
    expect(resolveApiErrorMessage({ error: "Error interno del servidor" }, "No se pudo procesar el comprobante por IA.")).toBe("Error interno del servidor")
  })

  it("extracts messages from request errors and plain errors", () => {
    expect(resolveApiErrorMessage(new ApiRequestError("No autorizado", 401, { error: "No autorizado" }), "Fallback")).toBe("No autorizado")
    expect(resolveApiErrorMessage(new Error("Fallo de red"), "Fallback")).toBe("Fallo de red")
  })

  it("extracts the public message from a serialized API error payload", () => {
    const serializedError = JSON.stringify({ error: "Error interno del servidor" })

    expect(resolveApiErrorMessage(new ApiRequestError(serializedError, 500, serializedError), "Fallback")).toBe("Error interno del servidor")
    expect(resolveApiErrorMessage(new Error(serializedError), "Fallback")).toBe("Error interno del servidor")
  })

  it("normalizes serialized JSON returned without an application/json content type", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Error interno del servidor" }), { status: 500, headers: { "content-type": "text/plain" } }))

    await expect(apiRequest("/api/vouchers/parse")).rejects.toMatchObject({ message: "Error interno del servidor", status: 500 })

    fetchMock.mockRestore()
  })

  it("uses the fallback when the received value has no public message", () => {
    expect(resolveApiErrorMessage({ detail: "internal detail" }, "No se pudo procesar el comprobante por IA.")).toBe("No se pudo procesar el comprobante por IA.")
  })
})
