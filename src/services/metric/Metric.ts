import { calculateCashMetrics, calculateMonthlyVariation } from "src/lib/helpers/metric/metric-calculations"
import { MetricRepository } from "src/repositories/metric/MetricRepository"
import type { AnalyticsPeriodSelection } from "src/types/analytics/analytics"
import type { MetricData } from "src/types/metric/metric"

export class Metric {
  private readonly repository: MetricRepository

  constructor(repository: MetricRepository = new MetricRepository()) {
    this.repository = repository
  }

  async getMetrics(companyId: string, now = new Date()): Promise<MetricData> {
    const year = now.getUTCFullYear()
    const monthIndex = now.getUTCMonth()
    const currentPeriod = createPeriod(year, monthIndex, now)
    const previousPeriod = monthIndex === 0 ? createPeriod(year - 1, 11, now) : createPeriod(year, monthIndex - 1, now)
    const vouchers = await this.repository.findForPeriod(companyId, previousPeriod.start, currentPeriod.end)
    const currentMetrics = calculateCashMetrics(vouchers, currentPeriod)
    const previousMetrics = calculateCashMetrics(vouchers, previousPeriod)
    const currencies = new Set([...Object.keys(currentMetrics.collections), ...Object.keys(currentMetrics.payments), ...Object.keys(previousMetrics.collections), ...Object.keys(previousMetrics.payments)])

    return {
      currentMonth: currentMetrics,
      variations: {
        collections: calculateCurrencyVariations(currencies, currentMetrics.collections, previousMetrics.collections),
        payments: calculateCurrencyVariations(currencies, currentMetrics.payments, previousMetrics.payments),
        balance: calculateCurrencyVariations(currencies, currentMetrics.balance, previousMetrics.balance),
      },
    }
  }
}

function createPeriod(year: number, monthIndex: number, now: Date): AnalyticsPeriodSelection {
  return { start: new Date(Date.UTC(year, monthIndex, 1)), end: new Date(Date.UTC(year, monthIndex + 1, 1)), now }
}

function calculateCurrencyVariations(currencies: Set<string>, current: Record<string, number>, previous: Record<string, number>) {
  return Object.fromEntries([...currencies].map((currency) => [currency, calculateMonthlyVariation(current[currency] ?? 0, previous[currency] ?? 0)]))
}
