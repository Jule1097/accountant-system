import { cn } from "src/lib/shared/utils";
import type { AnalyticsCurrency } from "src/components/analytics/analytics-header";
import type { ComparisonPeriodData } from "src/types/analytics/analytics";

interface AnalyticsComparisonTableProps {
  currency: AnalyticsCurrency;
  comparisons: ComparisonPeriodData[];
}

export function AnalyticsComparisonTable({ currency, comparisons }: AnalyticsComparisonTableProps) {
  return (
    <div className="flex-1 flex flex-col gap-4 p-5 bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="text-sm font-semibold text-foreground">Comparación Mensual vs Período Anterior</div>
      <div className="w-full overflow-auto">
        <div className="w-full flex flex-col">
          <div className="flex flex-row border-b border-border/60 py-2.5 min-w-[500px]">
            <div className="flex-1 text-[11px] font-semibold text-muted-foreground">Período</div>
            <div className="flex-1 text-[11px] font-semibold text-muted-foreground">Ingresos</div>
            <div className="flex-1 text-[11px] font-semibold text-muted-foreground">Egresos</div>
            <div className="flex-1 text-[11px] font-semibold text-muted-foreground">Margen</div>
          </div>
          <div className="flex flex-col min-w-[500px]">
            {comparisons.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground border-b border-border/60">No hay datos suficientes para comparar.</div>
            ) : (
              comparisons.map((comparison) => (
                <div key={comparison.month} className="flex flex-row items-center border-b border-border/60 py-3">
                  <div className="flex-1 text-[13px] font-medium text-foreground">{comparison.month}</div>
                  <div className="flex-1 text-[12px] font-mono text-muted-foreground">
                    {currency === "USD" ? "USD" : "$"} {comparison.income.toLocaleString("es-AR")}
                  </div>
                  <div className="flex-1 text-[12px] font-mono text-muted-foreground">
                    {currency === "USD" ? "USD" : "$"} {comparison.expenses.toLocaleString("es-AR")}
                  </div>
                  <div className="flex-1">
                    <div className={cn("w-fit px-2.5 py-1 rounded-full text-[11px] font-medium", comparison.margin >= 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500")}>
                      {comparison.margin}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
