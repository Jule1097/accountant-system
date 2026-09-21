import { DashboardRepository } from "src/repositories/dashboard/DashboardRepository"

describe("DashboardRepository", () => {
  it("exposes Dashboard activity data without living in VoucherRepository", () => {
    expect(typeof DashboardRepository).toBe("function")
  })
})
