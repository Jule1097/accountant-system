import { NextRequest } from "next/server"
import { GET } from "src/app/api/companies/route"
import { getAuthenticatedUserId } from "src/lib/helpers/auth/request-context"
import { CompanyService } from "src/services/company/Company"

jest.mock("src/lib/helpers/auth/request-context", () => ({
  getAuthenticatedUserId: jest.fn(),
}))

jest.mock("src/services/company/Company")

function createRequest(): NextRequest {
  return new NextRequest("http://localhost/api/companies")
}

describe("Companies API Route", () => {
  const getAuthenticatedUserIdMock = getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>
  const companyServiceMock = CompanyService as jest.MockedClass<typeof CompanyService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("loads companies for the authenticated user through the shared request helper", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1")
    companyServiceMock.prototype.getCompaniesByUser = jest.fn().mockResolvedValue([{ id: "company-1", name: "Acme" }])

    const response = await GET(createRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([{ id: "company-1", name: "Acme" }])
    expect(getAuthenticatedUserIdMock).toHaveBeenCalledWith(expect.any(NextRequest))
    expect(companyServiceMock.prototype.getCompaniesByUser).toHaveBeenCalledWith("user-1")
  })

  it("returns unauthorized when the shared request helper cannot authenticate the user", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null)
    companyServiceMock.prototype.getCompaniesByUser = jest.fn()

    const response = await GET(createRequest())

    expect(response.status).toBe(401)
    expect(companyServiceMock.prototype.getCompaniesByUser).not.toHaveBeenCalled()
  })
})
