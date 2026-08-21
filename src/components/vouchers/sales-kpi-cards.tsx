"use client";

import { VoucherSummaryResponse } from "src/types/voucher";

export function SalesKpiCards({ summary }: { summary: VoucherSummaryResponse }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <div className="flex flex-col gap-3 rounded-xl bg-card p-[18px] border border-border/50 min-w-0">
        <div className="text-xs font-medium text-muted-foreground tracking-wide">
          Comprobantes Filtrados
        </div>
        <div className="text-xl sm:text-2xl font-mono font-medium text-foreground truncate">
          {summary.totalCount} facturas
        </div>
        <div className="text-[11px] text-muted-foreground">
          Total de ventas dentro de la búsqueda actual
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-card p-[18px] border border-border/50 min-w-0">
        <div className="text-xs font-medium text-muted-foreground tracking-wide">
          Mayor Cliente
        </div>
        <div className="text-xl sm:text-2xl font-mono font-medium text-foreground truncate">
          {summary.topPartyName || "N/D"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Mayor volumen dentro del resultado filtrado
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-card p-[18px] border border-border/50 min-w-0">
        <div className="text-xs font-medium text-muted-foreground tracking-wide">
          Total Facturado
        </div>
        <div className="text-xl sm:text-2xl font-mono font-medium text-foreground truncate">
          $ {summary.totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Sumatoria del conjunto filtrado completo
        </div>
      </div>
    </div>
  );
}
