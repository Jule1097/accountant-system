"use client";

import { use } from "react";
import { Voucher } from "src/models/Voucher";

export function SalesKpiCards({ promise }: { promise: Promise<Voucher[]> | null }) {
  if (!promise) return null;
  const vouchers = use(promise);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthVouchers = vouchers.filter((v: Voucher) => {
    const d = new Date(v.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const count = thisMonthVouchers.length;
  
  const total = thisMonthVouchers.reduce((acc: number, v: Voucher) => acc + Number(v.totalAmount), 0);

  const clientTotals = thisMonthVouchers.reduce((acc: Record<string, number>, v: Voucher) => {
    if (v.supplier?.name) {
      acc[v.supplier.name] = (acc[v.supplier.name] || 0) + Number(v.totalAmount);
    }
    return acc;
  }, {} as Record<string, number>);

  let topClient = "N/A";
  let maxClientTotal = 0;
  Object.entries(clientTotals).forEach(([name, amount]) => {
    if (amount > maxClientTotal) {
      maxClientTotal = amount;
      topClient = name;
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <div className="flex flex-col gap-3 rounded-xl bg-card p-[18px] border border-border/50">
        <div className="text-xs font-medium text-muted-foreground tracking-wide">
          Comprobantes del Mes
        </div>
        <div className="text-2xl font-mono font-medium text-foreground">
          {count} facturas
        </div>
        <div className="text-[11px] text-muted-foreground">
          Total cargados en el período actual
        </div>
      </div>
      
      <div className="flex flex-col gap-3 rounded-xl bg-card p-[18px] border border-border/50">
        <div className="text-xs font-medium text-muted-foreground tracking-wide">
          Mayor Cliente
        </div>
        <div className="text-2xl font-mono font-medium text-foreground truncate">
          {topClient}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Mayor volumen de facturación
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-card p-[18px] border border-border/50">
        <div className="text-xs font-medium text-muted-foreground tracking-wide">
          Total Facturado
        </div>
        <div className="text-2xl font-mono font-medium text-foreground">
          $ {total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Mes actual (neto)
        </div>
      </div>
    </div>
  );
}
