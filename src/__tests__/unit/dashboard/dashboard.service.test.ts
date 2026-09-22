import { DashboardService } from "src/services/dashboard/Dashboard"
import { DashboardRepository } from "src/repositories/dashboard/DashboardRepository"

describe("DashboardService", () => {
  it("loads recent activity through the dashboard repository", async () => {
    const repository = new DashboardRepository()
    repository.findRecentActivity = jest.fn().mockResolvedValue({ weeklySales: [], recentPurchases: [] })
    const service = new DashboardService(repository)

    await service.getRecentActivity("company-1")

    expect(repository.findRecentActivity).toHaveBeenCalledWith("company-1")
  })
})
