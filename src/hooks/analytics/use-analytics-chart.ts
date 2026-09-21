import { useMemo } from "react"
import { analyticsCategoryColors, analyticsPurchaseCategoryLabels } from "src/lib/constants/analytics"
import type { AnalyticsChartEntry, AnalyticsData, ClientSalesEntry, ExpenseCategoryData } from "src/types/analytics/analytics"

export function useAnalyticsChart(data: AnalyticsData, currency: string) {
  return useMemo(() => {
    const activeData: AnalyticsChartEntry[] = data.trend.map((entry) => ({
      month: entry.month,
      cobros: entry.cobros[currency] ?? 0,
      pagos: entry.pagos[currency] ?? 0,
      balance: entry.balance[currency] ?? 0,
      margin: entry.margin[currency] ?? null,
      variation: entry.variation[currency] ?? { absolute: 0, percentage: null },
    }))
    const maxVal = Math.max(...activeData.flatMap((entry) => [entry.cobros, entry.pagos]), 0)
    const categories = data.annual.purchaseDistribution[currency] ?? []
    const expenseCategories: ExpenseCategoryData[] = categories.map((category, index) => ({ ...category, category: analyticsPurchaseCategoryLabels[category.id as keyof typeof analyticsPurchaseCategoryLabels] ?? category.id, color: analyticsCategoryColors[index % analyticsCategoryColors.length] }))
    const salesByClient: ClientSalesEntry[] = data.annual.salesByClient[currency] ?? []
    return {
      activeData,
      maxValue: maxVal > 0 ? maxVal * 1.15 : 1000,
      collections: data.annual.collections[currency] ?? 0,
      payments: data.annual.payments[currency] ?? 0,
      balance: data.annual.balance[currency] ?? 0,
      margin: data.annual.margin[currency] ?? null,
      collectionsVariation: data.annualVariations.collections[currency] ?? { absolute: 0, percentage: null },
      paymentsVariation: data.annualVariations.payments[currency] ?? { absolute: 0, percentage: null },
      balanceVariation: data.annualVariations.balance[currency] ?? { absolute: 0, percentage: null },
      expenseCategories,
      salesByClient,
    }
  }, [data, currency])
}
