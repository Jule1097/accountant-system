"use client"

import { useMemo, useState } from "react"
import { AnalyticsExpenseDistribution } from "src/components/analytics/analytics-expense-distribution"
import { AnalyticsHeader } from "src/components/analytics/analytics-header"
import { AnalyticsSalesByClient } from "src/components/analytics/analytics-sales-by-client"
import { AnalyticsSummaryCards } from "src/components/analytics/analytics-summary-cards"
import { AnalyticsTrendSection } from "src/components/analytics/analytics-trend-section"
import { AnalyticsSkeleton } from "src/components/analytics/analytics-skeleton"
import { useAnalytics } from "src/hooks/analytics/use-analytics"
import { useAnalyticsChart } from "src/hooks/analytics/use-analytics-chart"
import { useCompany } from "src/contexts/company-context"
import { analyticsDefaultCurrency, analyticsInitialCurrencies } from "src/lib/constants/analytics"
import type { AnalyticsData } from "src/types/analytics/analytics"

function getAvailableCurrencies(data: AnalyticsData): string[] {
  const periods = [data.currentMonth, data.annual]
  const currencies = new Set([
    ...analyticsInitialCurrencies,
    ...periods.flatMap((period) => Object.keys(period.collections)),
    ...periods.flatMap((period) => Object.keys(period.payments)),
    ...periods.flatMap((period) => Object.keys(period.sales)),
    ...periods.flatMap((period) => Object.keys(period.purchases)),
    ...periods.flatMap((period) => Object.keys(period.pending.amount)),
    ...periods.flatMap((period) => Object.keys(period.purchaseDistribution)),
    ...periods.flatMap((period) => Object.keys(period.salesByClient)),
    ...periods.flatMap((period) => [...period.taxes.retentions, ...period.taxes.perceptions].map((tax) => tax.currency)),
    ...data.trend.flatMap((entry) => [...Object.keys(entry.cobros), ...Object.keys(entry.pagos)]),
  ])
  return [...currencies]
}

function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const [currency, setCurrency] = useState(analyticsDefaultCurrency)
  const availableCurrencies = useMemo(() => getAvailableCurrencies(data), [data])
  const chart = useAnalyticsChart(data, currency)

  return (
    <div className="flex-1 space-y-6 overflow-hidden box-border">
      <AnalyticsHeader currency={currency} availableCurrencies={availableCurrencies} onCurrencyChange={setCurrency} />
      <AnalyticsSummaryCards currency={currency} collections={chart.collections} payments={chart.payments} balance={chart.balance} margin={chart.margin} collectionsVariation={chart.collectionsVariation} paymentsVariation={chart.paymentsVariation} balanceVariation={chart.balanceVariation} />
      <AnalyticsTrendSection activeData={chart.activeData} currency={currency} maxValue={chart.maxValue} />
      <div className="flex flex-col lg:flex-row gap-4 w-full items-stretch pb-10">
        <AnalyticsExpenseDistribution currency={currency} categories={chart.expenseCategories} />
        <AnalyticsSalesByClient key={currency} currency={currency} clients={chart.salesByClient} />
      </div>
    </div>
  )
}

export function AnalyticsContent() {
  const { data, isLoading, error } = useAnalytics({ suspense: false })
  const { activeCompanyId } = useCompany()
  if (error) return <div className="rounded-xl border border-destructive/40 bg-card p-6 text-sm text-destructive">No se pudieron cargar las analíticas.</div>
  if (isLoading || !data) return <AnalyticsSkeleton />
  return <AnalyticsDashboard key={activeCompanyId || analyticsDefaultCurrency} data={data} />
}
