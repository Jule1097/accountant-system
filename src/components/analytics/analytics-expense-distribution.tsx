import type { AnalyticsCurrency } from "src/components/analytics/analytics-header"
import type { ExpenseCategoryData } from "src/types/analytics/analytics"
import { getFormattedAmount } from "src/lib/helpers/platform/formatting"

interface AnalyticsExpenseDistributionProps {
  currency: AnalyticsCurrency
  categories: ExpenseCategoryData[]
}

export function AnalyticsExpenseDistribution({ currency, categories }: AnalyticsExpenseDistributionProps) {
  const total = categories.reduce((sum, category) => sum + Math.max(category.amount, 0), 0)
  const gradientStops = categories.reduce<{ stops: string[]; accumulatedPercentage: number }>((result, category) => {
    if (category.amount <= 0 || total <= 0) return result
    const end = result.accumulatedPercentage + (category.amount / total) * 100
    return { stops: [...result.stops, `${category.color} ${result.accumulatedPercentage}% ${end}%`], accumulatedPercentage: end }
  }, { stops: [], accumulatedPercentage: 0 }).stops
  const donutBackground = gradientStops.length > 0 ? `conic-gradient(${gradientStops.join(", ")})` : "transparent"

  return (
    <section className="w-full lg:w-[380px] flex flex-col gap-6 p-5 bg-card rounded-xl border border-border/50 flex-shrink-0" aria-labelledby="analytics-distribution-title">
      <h3 id="analytics-distribution-title" className="text-sm font-semibold text-foreground">Distribución de compras</h3>
      {categories.length === 0 ? <span className="text-xs text-muted-foreground">No existen comprobantes</span> : (
        <div className="w-full flex flex-col gap-3">
          <div className="flex justify-center py-2">
            <div data-testid="analytics-purchase-donut" role="img" aria-label="Distribución de compras" className="relative h-36 w-36 rounded-full" style={{ background: donutBackground }}>
              <div className="absolute inset-7 rounded-full bg-card" />
            </div>
          </div>
          {categories.map((category) => (
            <div key={category.id} className="w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: category.color }} /><span className="text-xs text-muted-foreground truncate">{category.category}</span></div>
              <div className="flex items-center gap-3 shrink-0"><span className="text-xs font-mono text-foreground">{getFormattedAmount(currency, category.amount)}</span><span className={`text-[11px] ${category.percentage <= 0 ? "text-red-500" : "text-muted-foreground"}`}>{category.percentage}%</span></div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
