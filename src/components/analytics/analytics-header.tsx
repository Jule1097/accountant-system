"use client";

import { cn } from "src/lib/shared/utils";

export type AnalyticsCurrency = "ARS" | "USD";
export type AnalyticsPeriod = "6_months" | "year";

interface AnalyticsHeaderProps {
  currency?: AnalyticsCurrency;
  period?: AnalyticsPeriod;
  showControls?: boolean;
  onCurrencyChange?: (currency: AnalyticsCurrency) => void;
  onPeriodChange?: (period: AnalyticsPeriod) => void;
}

export function AnalyticsHeader({
  currency = "ARS",
  period = "6_months",
  showControls = true,
  onCurrencyChange,
  onPeriodChange,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">
          Analíticas
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Métricas de proyección y tendencias de ingresos y egresos.
        </p>
      </div>
      {showControls ? (
        <div className="flex flex-wrap items-center gap-4 mt-2 sm:mt-0">
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
            <button
              type="button"
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", currency === "ARS" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => onCurrencyChange?.("ARS")}
            >
              ARS ($)
            </button>
            <button
              type="button"
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", currency === "USD" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => onCurrencyChange?.("USD")}
            >
              USD
            </button>
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
            <button
              type="button"
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", period === "6_months" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => onPeriodChange?.("6_months")}
            >
              6 Meses
            </button>
            <button
              type="button"
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", period === "year" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => onPeriodChange?.("year")}
            >
              Año
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
