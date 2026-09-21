"use client"

import { VoucherSummaryMetricCard } from "src/components/vouchers/voucher-summary-metric-card"
import { getFormattedAmount } from "src/lib/helpers/platform/formatting"
import type { VoucherSummaryResponse } from "src/types/voucher/voucher"

export function SalesKpiCards({ summary, currency }: { summary: VoucherSummaryResponse; currency: string }) {
  const topParty = summary.topParty[currency]
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <VoucherSummaryMetricCard title="Comprobantes" value={`${summary.totalCount}`} description={`Pendientes: ${summary.pendingCount}`} />
      <VoucherSummaryMetricCard title="Mayor cliente" value={topParty?.name || "N/D"} />
      <VoucherSummaryMetricCard title="Total facturado" value={getFormattedAmount(currency, summary.documentTotal[currency] ?? 0)} />
      <VoucherSummaryMetricCard title="Total cobrado" value={getFormattedAmount(currency, summary.cashTotal[currency] ?? 0)} />
    </div>
  )
}
