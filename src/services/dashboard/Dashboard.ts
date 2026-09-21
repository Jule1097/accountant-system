import { DashboardRepository } from "src/repositories/dashboard/DashboardRepository"
import type { DashboardRecentActivityData } from "src/types/dashboard/dashboard"

export class DashboardService {
  private readonly repository: DashboardRepository

  constructor(repository: DashboardRepository = new DashboardRepository()) {
    this.repository = repository
  }

  async getRecentActivity(companyId: string): Promise<DashboardRecentActivityData> {
    return this.repository.findRecentActivity(companyId)
  }
}
