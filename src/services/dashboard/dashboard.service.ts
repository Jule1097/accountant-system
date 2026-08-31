import { VoucherRepository } from "src/repositories/voucher/voucher.repository"
import { DashboardRecentActivityData } from "src/types/dashboard/dashboard"

export class DashboardService {
  private readonly repository: VoucherRepository

  constructor() {
    this.repository = new VoucherRepository()
  }

  async getRecentActivity(companyId: string): Promise<DashboardRecentActivityData> {
    return this.repository.findDashboardRecentActivity(companyId)
  }
}
