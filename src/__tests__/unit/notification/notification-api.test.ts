import { NextRequest } from "next/server"
import { GET } from "src/app/api/notifications/route"
import { CompanyNotificationService } from "src/services/company/CompanyNotification"

jest.mock("src/services/company/CompanyNotification")
jest.mock("src/lib/helpers/auth/request-context", () => {
  const { RequestContextError } = jest.requireActual("src/lib/errors/request-context")
  const { requestContextErrorCodes } = jest.requireActual("src/lib/constants/auth")
  return {
    requireRequestContext: jest.fn(async (request: NextRequest) => {
      const companyId = request.headers.get("x-company-id")
      if (!companyId) throw new RequestContextError(requestContextErrorCodes.companyRequired)
      return { userId: "user-1", companyId }
    }),
  }
})

function createRequest(overrides: Partial<NextRequest> = {}) {
  return {
    headers: { get: () => "company-1" },
    ...overrides,
  } as NextRequest
}

describe("Notification API Route Handler", () => {
  const notificationServiceMock = CompanyNotificationService as jest.MockedClass<typeof CompanyNotificationService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns notifications together with parser activity state", async () => {
    notificationServiceMock.prototype.listByCompany = jest.fn().mockResolvedValue({
      notifications: [],
      hasActiveParserBatch: true,
    })

    const response = await GET(createRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      notifications: [],
      hasActiveParserBatch: true,
    })
  })
})
