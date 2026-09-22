"use client"

import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { analyticsDefaultCurrency, analyticsMetricLabels, analyticsNoIncomeLabel, analyticsUnavailableValueLabel } from "src/lib/constants/analytics"
import { getFormattedAmount } from "src/lib/helpers/platform/formatting"
import { cn } from "src/lib/shared/utils"
import type { AnalyticsVariation, CurrencyAmounts } from "src/types/analytics/analytics"
import type { DashboardKpiCardsProps } from "src/types/dashboard/dashboard"

function getCurrencies(data?: DashboardKpiCardsProps["data"]): string[] {
  const currencies = new Set([analyticsDefaultCurrency, ...Object.keys(data?.currentMonth.collections ?? {}), ...Object.keys(data?.currentMonth.payments ?? {})])
  return [...currencies]
}

function getVariationLabel(variation: AnalyticsVariation): string {
  return variation.percentage === null ? analyticsUnavailableValueLabel : `${variation.percentage > 0 ? "+" : ""}${variation.percentage.toFixed(2)}%`
}

function Variation({ currency, variation, favorableWhenIncreasing }: { currency: string; variation: AnalyticsVariation; favorableWhenIncreasing: boolean }) {
  const direction = variation.absolute > 0 ? "up" : variation.absolute < 0 ? "down" : "stable"
  const favorable = direction === "stable" || (favorableWhenIncreasing ? direction === "up" : direction === "down")
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : Minus
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", favorable ? "text-green-500" : "text-red-500")}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{getVariationLabel(variation)}</span>
      <span className="sr-only">{favorable ? "variación favorable" : "variación desfavorable"}</span>
      <span className="text-muted-foreground">({getFormattedAmount(currency, variation.absolute)})</span>
    </span>
  )
}

function KpiValueList({ values, variations, favorableWhenIncreasing }: { values: CurrencyAmounts; variations: Record<string, AnalyticsVariation>; favorableWhenIncreasing: boolean }) {
  const currencies = Object.keys(values).length > 0 ? Object.keys(values) : [analyticsDefaultCurrency]
  return (
    <div className="space-y-3">
      {currencies.map((currency) => (
        <div key={currency} className="space-y-1">
          <span className="block text-[32px] font-mono font-medium leading-none tracking-[-1px] text-foreground">{getFormattedAmount(currency, values[currency] ?? 0)}</span>
          <Variation currency={currency} variation={variations[currency] ?? { absolute: 0, percentage: null }} favorableWhenIncreasing={favorableWhenIncreasing} />
        </div>
      ))}
    </div>
  )
}

export function KpiCards({ data }: DashboardKpiCardsProps) {
  const currencies = getCurrencies(data)
  const currentMonth = data?.currentMonth
  const cards = [
    { title: analyticsMetricLabels.collections, values: currentMonth?.collections ?? {}, variations: data?.variations.collections ?? {}, favorableWhenIncreasing: true },
    { title: analyticsMetricLabels.payments, values: currentMonth?.payments ?? {}, variations: data?.variations.payments ?? {}, favorableWhenIncreasing: false },
    { title: analyticsMetricLabels.balance, values: currentMonth?.balance ?? {}, variations: data?.variations.balance ?? {}, favorableWhenIncreasing: true },
  ]
  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {cards.map((card) => (
        <div key={card.title} className="flex-1 rounded-xl border border-border/50 bg-card p-5">
          <div className="pb-4 text-xs font-medium text-muted-foreground">{card.title}</div>
          <div className="space-y-3">
            <KpiValueList values={currencies.reduce<CurrencyAmounts>((result, currency) => ({ ...result, [currency]: card.values[currency] ?? 0 }), {})} variations={card.variations} favorableWhenIncreasing={card.favorableWhenIncreasing} />
            {card.title === analyticsMetricLabels.balance ? (
              <div className="space-y-1 text-xs text-muted-foreground">
                {currencies.map((currency) => <div key={currency}>{currency}: {currentMonth?.margin[currency] === null || currentMonth?.margin[currency] === undefined ? analyticsNoIncomeLabel : `Margen ${currentMonth.margin[currency]?.toFixed(2)}%`}</div>)}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
