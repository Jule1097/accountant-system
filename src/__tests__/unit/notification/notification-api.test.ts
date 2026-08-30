import { NextRequest } from "next/server"
import { GET } from "src/app/api/notifications/route"
import { CompanyNotificationService } from "src/services/company/company-notification.service"

jest.mock("src/services/company/company-notification.service")

function createRequest(overrides: Partial<NextRequest> = {}) {
  return {
    headers: { get: () => "company-1" },
    ...overrides,
  } as unknown as NextRequest
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
