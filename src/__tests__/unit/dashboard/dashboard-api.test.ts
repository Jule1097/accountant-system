import { NextRequest } from "next/server"
import { GET } from "src/app/api/dashboard/recent-activity/route"
import { DashboardService } from "src/services/dashboard/Dashboard"

jest.mock("src/services/dashboard/Dashboard")

function createRequest(overrides: Partial<NextRequest> = {}) {
  return {
    headers: new Headers({ "x-company-id": "company-1" }),
    ...overrides,
  } as unknown as NextRequest
}

describe("Dashboard recent activity API Route Handler", () => {
  const dashboardServiceMock = DashboardService as jest.MockedClass<typeof DashboardService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns the dashboard activity payload for the active company", async () => {
    dashboardServiceMock.prototype.getRecentActivity = jest.fn().mockResolvedValue({
      weeklySales: [],
      recentPurchases: [],
    })

    const response = await GET(createRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      weeklySales: [],
      recentPurchases: [],
    })
  })

  it("returns 400 when the company header is missing", async () => {
    const response = await GET(
      createRequest({
        headers: new Headers(),
      })
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Falta la empresa activa" })
  })
})
