import { requireRequestContext } from "src/lib/helpers/auth/request-context"

describe("request context", () => {
  const request = { headers: new Headers({ "x-company-id": "company-1" }) } as Request
  const dependencies = {
    getAuthenticatedUserId: jest.fn(),
    getUserCompanyIds: jest.fn(),
    belongsToCompany: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns the authenticated user and active company context", async () => {
    dependencies.getAuthenticatedUserId.mockResolvedValue("user-1")
    dependencies.belongsToCompany.mockResolvedValue(true)

    await expect(requireRequestContext(request, dependencies)).resolves.toEqual({ userId: "user-1", companyId: "company-1" })
    expect(dependencies.belongsToCompany).toHaveBeenCalledWith("user-1", "company-1")
  })

  it("rejects unauthenticated requests before checking company access", async () => {
    dependencies.getAuthenticatedUserId.mockResolvedValue(null)

    await expect(requireRequestContext(request, dependencies)).rejects.toMatchObject({ code: "UNAUTHENTICATED" })
    expect(dependencies.belongsToCompany).not.toHaveBeenCalled()
  })

  it("rejects requests without an active company", async () => {
    dependencies.getAuthenticatedUserId.mockResolvedValue("user-1")
    dependencies.getUserCompanyIds.mockResolvedValue([])
    const requestWithoutCompany = { headers: new Headers() } as Request

    await expect(requireRequestContext(requestWithoutCompany, dependencies)).rejects.toMatchObject({ code: "COMPANY_REQUIRED" })
    expect(dependencies.belongsToCompany).not.toHaveBeenCalled()
  })

  it("infers the active company when the user has exactly one company", async () => {
    dependencies.getAuthenticatedUserId.mockResolvedValue("user-1")
    dependencies.getUserCompanyIds.mockResolvedValue(["company-1"])

    await expect(requireRequestContext({ headers: new Headers() } as Request, dependencies)).resolves.toEqual({ userId: "user-1", companyId: "company-1" })
    expect(dependencies.belongsToCompany).not.toHaveBeenCalled()
  })

  it("rejects a company that is not assigned to the user", async () => {
    dependencies.getAuthenticatedUserId.mockResolvedValue("user-1")
    dependencies.belongsToCompany.mockResolvedValue(false)

    await expect(requireRequestContext(request, dependencies)).rejects.toMatchObject({ code: "COMPANY_FORBIDDEN" })
  })
})
