import { NextRequest } from "next/server"
import { GET } from "src/app/api/dashboard/recent-activity/route"
import { GET as getMetrics } from "src/app/api/metrics/route"
import { requestContextErrorCodes } from "src/lib/constants/auth"
import { RequestContextError } from "src/lib/errors/request-context"
import { DashboardService } from "src/services/dashboard/Dashboard"
import { Metric } from "src/services/metric/Metric"

jest.mock("src/lib/helpers/auth/request-context", () => ({
  requireRequestContext: jest.fn(async (request: NextRequest) => {
    const companyId = request.headers.get("x-company-id")
    if (!companyId) throw new RequestContextError(requestContextErrorCodes.companyRequired)
    return { userId: "user-1", companyId }
  }),
}))
jest.mock("src/services/dashboard/Dashboard")
jest.mock("src/services/metric/Metric")

function createRequest(overrides: Partial<NextRequest> = {}) {
  return {
    headers: new Headers({ "x-company-id": "company-1" }),
    ...overrides,
  } as NextRequest
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

  it("returns only the dashboard metrics payload for the active company", async () => {
    const metricServiceMock = Metric as jest.MockedClass<typeof Metric>
    metricServiceMock.prototype.getMetrics = jest.fn().mockResolvedValue({
      currentMonth: { collections: { ARS: 100 }, payments: { ARS: 40 }, balance: { ARS: 60 }, margin: { ARS: 60 } },
      variations: { collections: { ARS: { absolute: 20, percentage: 25 } }, payments: { ARS: { absolute: 10, percentage: 33.33 } }, balance: { ARS: { absolute: 10, percentage: 20 } } },
    })

    const response = await getMetrics(createRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      currentMonth: { collections: { ARS: 100 }, payments: { ARS: 40 }, balance: { ARS: 60 }, margin: { ARS: 60 } },
      variations: { collections: { ARS: { absolute: 20, percentage: 25 } }, payments: { ARS: { absolute: 10, percentage: 33.33 } }, balance: { ARS: { absolute: 10, percentage: 20 } } },
    })
    expect(metricServiceMock.prototype.getMetrics).toHaveBeenCalledWith("company-1")
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
