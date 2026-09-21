import type { VoucherSummaryMetricCardProps } from "src/types/voucher/voucher"

export function VoucherSummaryMetricCard({ title, value, description }: VoucherSummaryMetricCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/50 bg-card p-[18px]">
      <div className="text-xs font-medium tracking-wide text-muted-foreground">{title}</div>
      <div className="truncate text-xl font-mono font-medium text-foreground sm:text-2xl">{value}</div>
      {description && <div className="text-[11px] text-muted-foreground text-red-500">{description}</div>}
    </div>
  )
}
