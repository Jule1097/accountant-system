import type { AnalyticsCurrency } from "src/components/analytics/analytics-header"
import { analyticsUnavailableValueLabel } from "src/lib/constants/analytics"
import type { AnalyticsChartEntry } from "src/types/analytics/analytics"
import { getFormattedAmount } from "src/lib/helpers/platform/formatting"

interface AnalyticsTrendSectionProps {
  activeData: AnalyticsChartEntry[]
  currency: AnalyticsCurrency
  maxValue: number
}

export function AnalyticsTrendSection({ activeData, currency, maxValue }: AnalyticsTrendSectionProps) {
  return (
    <section className="flex flex-col gap-5 p-6 bg-card rounded-xl border border-border/50 w-full" aria-labelledby="analytics-trend-title">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 id="analytics-trend-title" className="text-sm font-semibold text-foreground">Tendencia anual de cobros y pagos</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="text-emerald-500">Cobros</span><span className="text-rose-500">Pagos</span></div>
      </div>
      <div className="grid grid-cols-12 gap-1 sm:gap-2 h-[220px] items-end" role="list" aria-label="Resumen mensual de cobros y pagos">
        {activeData.map((entry) => {
          const collectionsHeight = maxValue > 0 ? (entry.cobros / maxValue) * 100 : 0
          const paymentsHeight = maxValue > 0 ? (entry.pagos / maxValue) * 100 : 0
          return (
            <div key={entry.month} className="min-w-0 h-full flex flex-col justify-end items-center gap-2" role="listitem" tabIndex={0} aria-label={`${entry.month}: cobros ${getFormattedAmount(currency, entry.cobros)}, pagos ${getFormattedAmount(currency, entry.pagos)}`}>
              <div className="relative w-full h-full flex items-end justify-center gap-0.5 group">
                <div className="w-1/2 max-w-8 rounded-t-sm bg-emerald-500" style={{ height: `${collectionsHeight}%` }} />
                <div className="w-1/2 max-w-8 rounded-t-sm bg-rose-500" style={{ height: `${paymentsHeight}%` }} />
                <div className="absolute bottom-full hidden group-hover:flex group-focus-within:flex flex-col gap-1 p-2 rounded-md border border-border bg-popover text-xs text-popover-foreground shadow-lg whitespace-nowrap z-10">
                  <span className="font-medium">{entry.month}</span>
                  <span>Cobros: {getFormattedAmount(currency, entry.cobros)}</span>
                  <span>Pagos: {getFormattedAmount(currency, entry.pagos)}</span>
                  <span>Balance: {getFormattedAmount(currency, entry.balance)}</span>
                  <span>Variación: {entry.variation.percentage === null ? analyticsUnavailableValueLabel : `${entry.variation.percentage.toFixed(2)}%`}</span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground truncate max-w-full">{entry.month.slice(0, 3)}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
