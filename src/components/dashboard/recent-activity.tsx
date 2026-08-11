"use client";

import { useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "src/components/ui/card";
import { Voucher } from "src/models/Voucher";

interface RecentActivityProps {
  promise: Promise<Voucher[]> | null;
}

export function RecentActivity({ promise }: RecentActivityProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  if (!promise) return null;
  const vouchers = use(promise);

  const sales = vouchers.filter((v: Voucher) => v.type === 'sale').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const weeklySales = [
    { week: "Semana 1", amount: 0 },
    { week: "Semana 2", amount: 0 },
    { week: "Semana 3", amount: 0 },
    { week: "Semana 4", amount: 0 },
    { week: "Semana 5", amount: 0 },
  ];

  const now = new Date();
  const days35Ago = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);

  sales.forEach(s => {
    const d = new Date(s.date);
    if (d >= days35Ago) {
      const diffTime = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = 4 - Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 5) {
        weeklySales[weekIndex].amount += Number(s.totalAmount);
      }
    }
  });

  const recentPurchases = vouchers
    .filter((v: Voucher) => v.type === 'purchase')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const maxVal = Math.max(...weeklySales.map(s => s.amount)) * 1.2 || 25000;


  return (
    <div className="flex flex-col gap-7 w-full">
      <Card className="rounded-xl p-6 shadow-none border-border/50">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Ventas por Semana</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Tendencia de facturación de las últimas semanas del mes.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[210px] flex items-end justify-between p-0 pt-6 px-6 pb-6 gap-3">
          {weeklySales.map((item, idx) => {
            const barHeightPct = maxVal > 0 ? (item.amount / maxVal) * 100 : 0;
            return (
              <div
                key={idx}
                className="flex flex-col flex-1 items-center justify-end gap-2 h-full group"
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ position: 'relative' }}
              >
                {hoveredBar === idx && (
                  <div className="absolute -top-8 bg-popover text-popover-foreground border rounded-lg shadow-md px-3 py-1.5 text-xs pointer-events-none transition-all duration-150 z-10 whitespace-nowrap">
                    <div className="font-bold">${item.amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                )}
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    className="w-full bg-[#FF5C00] rounded-t-[4px] transition-all duration-200 group-hover:bg-[#FF5C00]/80"
                    style={{ height: `${barHeightPct}%`, minHeight: barHeightPct > 0 ? '4px' : '0px' }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Sem {idx + 1}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-semibold text-foreground">Últimas Compras</h3>
        </div>
        <div className="space-y-4">
          {recentPurchases.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay compras registradas recientemente.</p>
          ) : (
            recentPurchases.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {item.supplier?.name.substring(0, 2).toUpperCase() || "SC"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-none text-foreground">{item.supplier?.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-red-500/10 text-red-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {item.voucherType?.name || "Factura"}
                  </span>
                  <div className="text-sm font-mono font-medium text-red-500">
                    -${Number(item.totalAmount).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
