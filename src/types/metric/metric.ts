import type { AnalyticsCashMetrics, AnalyticsVariation } from "src/types/analytics/analytics"

export interface MetricData {
  currentMonth: AnalyticsCashMetrics
  variations: {
    collections: Record<string, AnalyticsVariation>
    payments: Record<string, AnalyticsVariation>
    balance: Record<string, AnalyticsVariation>
  }
}
