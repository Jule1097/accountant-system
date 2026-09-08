import type { AnalyticsCurrency } from "src/components/analytics/analytics-header";

interface AnalyticsSummaryCardsProps {
  currency: AnalyticsCurrency;
  salesValue: number;
  totalExpenses: number;
  marginPercentage: string;
}

function formatAnalyticsAmount(currency: AnalyticsCurrency, value: number): string {
  return `${currency === "USD" ? "USD" : "$"} ${value.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

export function AnalyticsSummaryCards({
  currency,
  salesValue,
  totalExpenses,
  marginPercentage,
}: AnalyticsSummaryCardsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <div className="flex-1 flex flex-col gap-4 p-5 bg-card rounded-xl border border-border/50">
        <div className="flex w-full items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground tracking-[0.5px]">Facturación del Mes</div>
        </div>
        <div className="text-[32px] font-mono font-medium text-foreground tracking-[-1px] leading-none">
          {formatAnalyticsAmount(currency, salesValue)}
        </div>
        <div className="text-[11px] text-muted-foreground">Total de ventas netas registradas en los últimos 30 días.</div>
      </div>
      <div className="flex-1 flex flex-col gap-4 p-5 bg-card rounded-xl border border-border/50">
        <div className="flex w-full items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground tracking-[0.5px]">Egresos del Mes</div>
        </div>
        <div className="text-[32px] font-mono font-medium text-foreground tracking-[-1px] leading-none">
          {formatAnalyticsAmount(currency, totalExpenses)}
        </div>
        <div className="text-[11px] text-muted-foreground">Compras netas, percepciones e IVA de los últimos 30 días.</div>
      </div>
      <div className="flex-1 flex flex-col gap-4 p-5 bg-card rounded-xl border border-border/50">
        <div className="flex w-full items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground tracking-[0.5px]">Margen Neto Mensual</div>
        </div>
        <div className="text-[32px] font-mono font-medium text-foreground tracking-[-1px] leading-none">
          {marginPercentage}%
        </div>
        <div className="text-[11px] text-muted-foreground">Rentabilidad relativa de ingresos frente a egresos.</div>
      </div>
    </div>
  );
}
