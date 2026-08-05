import AnalyticsPage from "src/app/(dashboard)/analytics/page"
import { AnalyticsView } from "src/components/analytics/analytics-view"

describe("Analytics Module Exports", () => {
  it("should export AnalyticsPage as a function", () => {
    expect(typeof AnalyticsPage).toBe("function")
  })

  it("should export AnalyticsView as a function", () => {
    expect(typeof AnalyticsView).toBe("function")
  })
})
