import { createClientSupplierMutationAdapter } from "src/lib/helpers/third-party/third-party-resource-adapter"

const apiRequestMock = jest.fn()

jest.mock("src/lib/api/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}))

describe("client supplier resource adapter", () => {
  it.each(["clients", "suppliers"] as const)("executes %s deletion without parsing a 204 response", async (type) => {
    const response = new Response(null, { status: 204 })
    apiRequestMock.mockResolvedValue(response)
    const adapter = createClientSupplierMutationAdapter(type)

    await adapter.remove?.("company-1", `${type}-1`)

    expect(apiRequestMock).toHaveBeenCalledWith(`/api/${type}/${type}-1`, {
      method: "DELETE",
      headers: { "x-company-id": "company-1" },
    })
  })
})
