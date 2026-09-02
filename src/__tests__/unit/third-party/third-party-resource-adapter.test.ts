import { createClientSupplierMutationAdapter } from "src/lib/helpers/third-party/third-party-resource-adapter"

const apiRequestMock = jest.fn()

jest.mock("src/lib/api/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}))

describe("client supplier resource adapter", () => {
  it("executes deletion through the injected resource operation boundary", async () => {
    const response = { json: jest.fn() }
    apiRequestMock.mockResolvedValue(response)
    const adapter = createClientSupplierMutationAdapter("clients")

    await adapter.remove?.("company-1", "client-1")

    expect(apiRequestMock).toHaveBeenCalledWith("/api/clients/client-1", {
      method: "DELETE",
      headers: { "x-company-id": "company-1" },
    })
  })
})
