import type { AnalyticsCurrency } from "src/components/analytics/analytics-header";
import type { TrendEntry } from "src/types/analytics/analytics";

interface AnalyticsTrendSectionProps {
  activeData: TrendEntry[];
  currency: AnalyticsCurrency;
  maxValue: number;
}

function formatTrendAmount(currency: AnalyticsCurrency, value: number): string {
  return `${currency === "USD" ? "USD" : "$"} ${value.toLocaleString("es-AR")}`;
}

export function AnalyticsTrendSection({ activeData, currency, maxValue }: AnalyticsTrendSectionProps) {
  return (
    <div className="flex flex-col gap-5 p-6 bg-card rounded-xl border border-border/50 w-full">
      <div className="flex flex-row justify-between items-center w-full">
        <div className="text-sm font-semibold text-foreground">Tendencia de Ingresos y Egresos</div>
        <div className="text-xs text-muted-foreground hidden sm:block">Representación de la facturación y gastos mensuales del período seleccionado.</div>
      </div>
      <div className="w-full h-[180px] flex flex-row gap-3 items-end justify-start mt-2">
        {activeData.length === 0 ? (
          <p className="text-xs text-muted-foreground w-full text-center">No hay datos suficientes para graficar.</p>
        ) : (
          activeData.map((entry) => {
            const incomePercentage = maxValue > 0 ? (entry.income / maxValue) * 100 : 0;
            const expensesPercentage = maxValue > 0 ? (entry.expenses / maxValue) * 100 : 0;

            return (
              <div key={entry.month} className="flex-1 h-full flex flex-col gap-2 justify-end items-center group relative">
                <div className="absolute bottom-[105%] opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border text-popover-foreground text-xs rounded-md p-3 shadow-lg whitespace-nowrap z-10 pointer-events-none flex flex-col gap-1.5">
                  <div className="font-bold mb-1 border-b border-border pb-1">{entry.month}</div>
                  <div className="flex gap-4 justify-between">
                    <span className="text-emerald-500">Ingresos:</span>
                    <span className="font-mono">{formatTrendAmount(currency, entry.income)}</span>
                  </div>
                  <div className="flex gap-4 justify-between">
                    <span className="text-rose-500">Egresos:</span>
                    <span className="font-mono">{formatTrendAmount(currency, entry.expenses)}</span>
                  </div>
                </div>
                <div className="w-full h-full flex flex-row gap-1 items-end justify-center group-hover:opacity-80 transition-opacity">
                  <div className="flex-1 max-w-[40px] bg-emerald-500 rounded-t-sm" style={{ height: `${incomePercentage}%` }} />
                  <div className="flex-1 max-w-[40px] bg-rose-500 rounded-t-sm" style={{ height: `${expensesPercentage}%` }} />
                </div>
                <div className="text-[11px] text-muted-foreground">{entry.month.substring(0, 3)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
