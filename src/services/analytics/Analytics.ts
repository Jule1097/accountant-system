import { buildAnnualTrend, calculateCashVariations, calculatePeriodMetrics } from "src/lib/helpers/metric/metric-calculations"
import { MetricRepository } from "src/repositories/metric/MetricRepository"
import type { AnalyticsData, AnalyticsPeriodSelection } from "src/types/analytics/analytics"

function createPeriod(year: number, monthIndex: number, now: Date): AnalyticsPeriodSelection {
  return { start: new Date(Date.UTC(year, monthIndex, 1)), end: new Date(Date.UTC(year, monthIndex + 1, 1)), now }
}

function createYearToDatePeriod(year: number, now: Date): AnalyticsPeriodSelection {
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate() + 1)), now }
}

export class AnalyticsService {
  private repository: MetricRepository

  constructor(repository: MetricRepository = new MetricRepository()) {
    this.repository = repository
  }

  async getAnalytics(companyId: string): Promise<AnalyticsData> {
    const now = new Date()
    const year = now.getUTCFullYear()
    const queryStart = new Date(Date.UTC(year - 1, 0, 1))
    const queryEnd = new Date(Date.UTC(year + 1, 0, 1))
    const vouchers = await this.repository.findForPeriod(companyId, queryStart, queryEnd)
    const currentMonth = createPeriod(year, now.getUTCMonth(), now)
    const currentYear = createYearToDatePeriod(year, now)
    const previousYear = createYearToDatePeriod(year - 1, new Date(Date.UTC(year - 1, now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds())))
    const currentYearMetrics = calculatePeriodMetrics(vouchers, currentYear, currentYear)
    const previousYearMetrics = calculatePeriodMetrics(vouchers, previousYear, previousYear)

    return {
      currentMonth: calculatePeriodMetrics(vouchers, currentMonth, currentMonth),
      annual: currentYearMetrics,
      annualVariations: calculateCashVariations(currentYearMetrics, previousYearMetrics),
      trend: buildAnnualTrend(vouchers, year, now),
    }
  }
}
