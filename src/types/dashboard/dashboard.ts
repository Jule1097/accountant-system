import { AnalyticsData } from "src/types/analytics/analytics"

export interface DashboardWeeklySalesEntry {
  week: string
  amount: number
}

export interface DashboardRecentPurchaseEntry {
  id: string
  supplierName: string | null
  date: string
  voucherTypeName: string | null
  totalAmount: number
}

export interface DashboardRecentActivityData {
  weeklySales: DashboardWeeklySalesEntry[]
  recentPurchases: DashboardRecentPurchaseEntry[]
}

export interface DashboardRecentActivityProps {
  data?: DashboardRecentActivityData
}

export interface DashboardKpiCardsProps {
  data?: AnalyticsData
}
