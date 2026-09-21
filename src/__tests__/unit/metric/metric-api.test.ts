import { NextRequest } from "next/server"
import { GET } from "src/app/api/metrics/route"
import { Metric } from "src/services/metric/Metric"

jest.mock("src/services/metric/Metric")
jest.mock("src/lib/helpers/auth/request-context", () => ({
  requireRequestContext: jest.fn(async () => ({ userId: "user-1", companyId: "company-1" })),
}))

describe("Metric API route", () => {
  it("passes the authenticated company to Metric", async () => {
    const metricServiceMock = Metric as jest.MockedClass<typeof Metric>
    metricServiceMock.prototype.getMetrics = jest.fn().mockResolvedValue({
      currentMonth: { collections: {}, payments: {}, balance: {}, margin: {} },
      variations: { collections: {}, payments: {}, balance: {} },
    })

    const response = await GET(new NextRequest("http://localhost/api/metrics"))

    expect(response.status).toBe(200)
    expect(metricServiceMock.prototype.getMetrics).toHaveBeenCalledWith("company-1")
  })
})
