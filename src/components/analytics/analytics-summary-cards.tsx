import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { cn } from "src/lib/shared/utils"
import { analyticsAnnualMetricLabels, analyticsNoIncomeLabel, analyticsUnavailableValueLabel } from "src/lib/constants/analytics"
import { getFormattedAmount } from "src/lib/helpers/platform/formatting"
import type { AnalyticsSummaryCardsProps, AnalyticsVariation } from "src/types/analytics/analytics"

function formatVariation(variation: AnalyticsVariation): string {
  return variation.percentage === null ? analyticsUnavailableValueLabel : `${variation.percentage > 0 ? "+" : ""}${variation.percentage.toFixed(2)}%`
}

function VariationIndicator({ currency, variation, favorableWhenIncreasing }: { currency: string; variation: AnalyticsVariation; favorableWhenIncreasing: boolean }) {
  const direction = variation.absolute > 0 ? "up" : variation.absolute < 0 ? "down" : "stable"
  const favorable = direction === "stable" || (favorableWhenIncreasing ? direction === "up" : direction === "down")
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : Minus
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", favorable ? "text-green-500" : "text-red-500")}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{formatVariation(variation)}</span>
      <span className="sr-only">{favorable ? "variación favorable" : "variación desfavorable"}</span>
      <span className="text-muted-foreground">({getFormattedAmount(currency, variation.absolute)})</span>
    </span>
  )
}

function SummaryCard({ currency, title, value, variation, favorableWhenIncreasing, secondary }: { currency: string; title: string; value: string; variation: AnalyticsVariation; favorableWhenIncreasing: boolean; secondary?: string }) {
  return (
    <div className="flex-1 rounded-xl border border-border/50 bg-card p-5">
      <div className="pb-4 text-xs font-medium text-muted-foreground">{title}</div>
      <div className="space-y-3">
        <div className="text-[32px] font-mono font-medium text-foreground tracking-[-1px] leading-none">{value}</div>
        {secondary ? <div className="text-sm text-muted-foreground">{secondary}</div> : null}
        <VariationIndicator currency={currency} variation={variation} favorableWhenIncreasing={favorableWhenIncreasing} />
      </div>
    </div>
  )
}

export function AnalyticsSummaryCards({ currency, periodLabel, collections, payments, balance, margin, collectionsVariation, paymentsVariation, balanceVariation }: AnalyticsSummaryCardsProps) {
  return (
    <div className="space-y-3">
      {periodLabel ? <div className="text-xs text-muted-foreground">{periodLabel}</div> : null}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <SummaryCard currency={currency} title={analyticsAnnualMetricLabels.collections} value={getFormattedAmount(currency, collections)} variation={collectionsVariation} favorableWhenIncreasing />
        <SummaryCard currency={currency} title={analyticsAnnualMetricLabels.payments} value={getFormattedAmount(currency, payments)} variation={paymentsVariation} favorableWhenIncreasing={false} />
        <SummaryCard currency={currency} title={analyticsAnnualMetricLabels.balance} value={getFormattedAmount(currency, balance)} variation={balanceVariation} favorableWhenIncreasing secondary={margin === null ? analyticsNoIncomeLabel : `Margen ${margin.toFixed(2)}%`} />
      </div>
    </div>
  )
}
