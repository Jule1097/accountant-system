"use client";

import { useState } from "react";
import { AnalyticsSkeleton } from "src/components/analytics/analytics-skeleton";
import { cn } from "src/lib/utils";
import { useAnalytics } from "src/hooks/use-analytics";
import { useAnalyticsChart } from "src/hooks/use-analytics-chart";
import { AnalyticsData, TrendEntry, ComparisonPeriodData } from "src/types/analytics";

function AnalyticsContainer({ data }: { data: AnalyticsData }) {
  const [period, setPeriod] = useState<"6_months" | "year">("6_months");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");

  const {
    activeData,
    maxVal,
    salesVal,
    totalMonthlyExpenses,
    marginPercentage,
    expenseCategories,
    getCategoryOffset,
    comparisons,
  } = useAnalyticsChart(data, currency, period);

  return (
    <div className="flex-1 space-y-6 overflow-hidden box-border">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">
            Analíticas
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Métricas de proyección y tendencias de ingresos y egresos.
          </p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex flex-wrap items-center gap-4 mt-2 sm:mt-0">
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
            <button
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", currency === "ARS" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setCurrency("ARS")}
            >
              ARS ($)
            </button>
            <button
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", currency === "USD" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setCurrency("USD")}
            >
              USD
            </button>
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
            <button
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", period === "6_months" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setPeriod("6_months")}
            >
              6 Meses
            </button>
            <button
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", period === "year" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setPeriod("year")}
            >
              Año
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Facturación */}
        <div className="flex-1 flex flex-col gap-4 p-5 bg-card rounded-xl border border-border/50">
          <div className="flex w-full items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground tracking-[0.5px]">
              Facturación del Mes
            </div>
          </div>
          <div className="text-[32px] font-mono font-medium text-foreground tracking-[-1px] leading-none">
            {currency === "USD" ? "USD" : "$"} {salesVal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Total de ventas netas registradas en los últimos 30 días.
          </div>
        </div>

        {/* Egresos */}
        <div className="flex-1 flex flex-col gap-4 p-5 bg-card rounded-xl border border-border/50">
          <div className="flex w-full items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground tracking-[0.5px]">
              Egresos del Mes
            </div>
          </div>
          <div className="text-[32px] font-mono font-medium text-foreground tracking-[-1px] leading-none">
            {currency === "USD" ? "USD" : "$"} {totalMonthlyExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Compras netas, percepciones e IVA de los últimos 30 días.
          </div>
        </div>

        {/* Margen Neto */}
        <div className="flex-1 flex flex-col gap-4 p-5 bg-card rounded-xl border border-border/50">
          <div className="flex w-full items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground tracking-[0.5px]">
              Margen Neto Mensual
            </div>
          </div>
          <div className="text-[32px] font-mono font-medium text-foreground tracking-[-1px] leading-none">
            {marginPercentage}%
          </div>
          <div className="text-[11px] text-muted-foreground">
            Rentabilidad relativa de ingresos frente a egresos.
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex flex-col gap-5 p-6 bg-card rounded-xl border border-border/50 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="text-sm font-semibold text-foreground">
            Tendencia de Ingresos y Egresos
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block">
            Representación de la facturación y gastos mensuales del período seleccionado.
          </div>
        </div>
        
        {/* Chart Area */}
        <div className="w-full h-[180px] flex flex-row gap-3 items-end justify-start mt-2">
          {activeData.length === 0 ? (
            <p className="text-xs text-muted-foreground w-full text-center">No hay datos suficientes para graficar.</p>
          ) : (
            activeData.map((d: TrendEntry, idx: number) => {
              const incomePct = maxVal > 0 ? (d.income / maxVal) * 100 : 0;
              const expensesPct = maxVal > 0 ? (d.expenses / maxVal) * 100 : 0;
              return (
                <div key={idx} className="flex-1 h-full flex flex-col gap-2 justify-end items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-[105%] opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border text-popover-foreground text-xs rounded-md p-3 shadow-lg whitespace-nowrap z-10 pointer-events-none flex flex-col gap-1.5">
                    <div className="font-bold mb-1 border-b border-border pb-1">{d.month}</div>
                    <div className="flex gap-4 justify-between">
                      <span className="text-emerald-500">Ingresos:</span>
                      <span className="font-mono">{currency === "USD" ? "USD" : "$"} {d.income.toLocaleString("es-AR")}</span>
                    </div>
                    <div className="flex gap-4 justify-between">
                      <span className="text-rose-500">Egresos:</span>
                      <span className="font-mono">{currency === "USD" ? "USD" : "$"} {d.expenses.toLocaleString("es-AR")}</span>
                    </div>
                  </div>

                  <div className="w-full h-full flex flex-row gap-1 items-end justify-center group-hover:opacity-80 transition-opacity">
                    <div 
                      className="flex-1 max-w-[40px] bg-emerald-500 rounded-t-sm" 
                      style={{ height: `${incomePct}%` }}
                    />
                    <div 
                      className="flex-1 max-w-[40px] bg-rose-500 rounded-t-sm" 
                      style={{ height: `${expensesPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {d.month.substring(0, 3)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Analytics Bottom Row 1 */}
      <div className="flex flex-col lg:flex-row gap-4 w-full items-stretch pb-10">
        {/* Donut Card */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6 p-5 bg-card rounded-xl border border-border/50 flex-shrink-0">
          <div className="text-sm font-semibold text-foreground">
            Distribución de Egresos
          </div>
          
          <div className="w-full h-[120px] relative flex justify-center items-center">
            {expenseCategories.length === 0 ? (
               <span className="text-xs text-muted-foreground">Sin egresos este mes</span>
            ) : (
              <>
                <svg viewBox="0 0 120 120" className="w-[120px] h-[120px] transform -rotate-90">
                  {expenseCategories.map((c, idx) => (
                    <circle
                      key={idx}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={c.color}
                      strokeWidth="16"
                      strokeDasharray={`${(c.percentage / 100) * 314.16} 314.16`}
                      strokeDashoffset={getCategoryOffset(idx)}
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[12px] font-semibold text-foreground">
                    100% Total
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-full flex flex-col gap-3 mt-2 overflow-y-auto max-h-[120px] pr-1">
            {expenseCategories.map((c, idx) => (
              <div key={idx} className="w-full flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <div className="text-xs text-muted-foreground truncate max-w-[100px]">{c.category}</div>
                </div>
                <div className="flex flex-row items-center gap-3">
                  <div className="text-xs font-mono text-foreground">
                    {currency === "USD" ? "USD" : "$"} {c.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-muted-foreground w-6 text-right">
                    {c.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Card */}
        <div className="flex-1 flex flex-col gap-4 p-5 bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="text-sm font-semibold text-foreground">
            Comparación Mensual vs Período Anterior
          </div>
          <div className="w-full overflow-auto">
            <div className="w-full flex flex-col">
              {/* Table Head */}
              <div className="flex flex-row border-b border-border/60 py-2.5 min-w-[500px]">
                <div className="flex-1 text-[11px] font-semibold text-muted-foreground">Período</div>
                <div className="flex-1 text-[11px] font-semibold text-muted-foreground">Ingresos</div>
                <div className="flex-1 text-[11px] font-semibold text-muted-foreground">Egresos</div>
                <div className="flex-1 text-[11px] font-semibold text-muted-foreground">Margen</div>
              </div>
              
              {/* Table Rows */}
              <div className="flex flex-col min-w-[500px]">
                {comparisons.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground border-b border-border/60">
                    No hay datos suficientes para comparar.
                  </div>
                ) : (
                  comparisons.map((c: ComparisonPeriodData, idx: number) => (
                    <div key={idx} className="flex flex-row items-center border-b border-border/60 py-3">
                      <div className="flex-1 text-[13px] font-medium text-foreground">{c.month}</div>
                      <div className="flex-1 text-[12px] font-mono text-muted-foreground">
                        {currency === "USD" ? "USD" : "$"} {c.income.toLocaleString("es-AR")}
                      </div>
                      <div className="flex-1 text-[12px] font-mono text-muted-foreground">
                        {currency === "USD" ? "USD" : "$"} {c.expenses.toLocaleString("es-AR")}
                      </div>
                      <div className="flex-1">
                        <div className={cn(
                          "w-fit px-2.5 py-1 rounded-full text-[11px] font-medium",
                          c.margin >= 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"
                        )}>
                          {c.margin}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsView() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return <AnalyticsSkeleton />;
  }

  return <AnalyticsContainer data={data} />;
}
