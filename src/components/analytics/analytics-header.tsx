"use client"

import { cn } from "src/lib/shared/utils"
import { analyticsDefaultCurrency } from "src/lib/constants/analytics"
import type { AnalyticsHeaderProps } from "src/types/analytics/analytics"

export type AnalyticsCurrency = string

export function AnalyticsHeader({ currency = analyticsDefaultCurrency, availableCurrencies = [analyticsDefaultCurrency], showControls = true, onCurrencyChange }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">Analíticas</h2>
        <p className="text-sm text-muted-foreground mt-2">Métricas de cobros, pagos y tendencias financieras.</p>
      </div>
      {showControls ? (
        <div className="flex flex-wrap items-center gap-4 mt-2 sm:mt-0">
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card" role="group" aria-label="Moneda">
            {availableCurrencies.map((option) => (
              <button key={option} type="button" aria-pressed={currency === option} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", currency === option ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => onCurrencyChange?.(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
