import { apiRequest } from "src/lib/api/api-client"
import { buildCompanyPathKey, companyPathFetcher } from "src/lib/helpers/platform/swr"

jest.mock("src/lib/api/api-client", () => ({
  apiRequest: jest.fn(),
  parseJsonResponse: async (response: Response) => response.json(),
}))

describe("companyPathFetcher", () => {
  const apiRequestMock = apiRequest as jest.MockedFunction<typeof apiRequest>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("uses the company id from the SWR key as the request header source of truth", async () => {
    apiRequestMock.mockResolvedValue({
      json: async () => ({
        ok: true,
      }),
    } as Response)

    await expect(companyPathFetcher("company-1", "/api/analytics")).resolves.toEqual({
      ok: true,
    })

    expect(apiRequestMock).toHaveBeenCalledWith("/api/analytics", {
      headers: {
        "x-company-id": "company-1",
      },
    })
  })

  it("does not build a fetch key while the company-scoped request is disabled", () => {
    expect(buildCompanyPathKey("company-1", "/api/analytics", false)).toBeNull()
  })
})
