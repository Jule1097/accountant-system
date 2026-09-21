"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "src/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import { routePaths } from "src/lib/constants/sidebar-routes";
import type { DashboardRecentActivityProps } from "src/types/dashboard/dashboard";

export function RecentActivity({ data }: DashboardRecentActivityProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const weeklySales = data?.weeklySales || [];
  const recentPurchases = data?.recentPurchases || [];
  const maxVal = Math.max(...weeklySales.map((item) => item.amount)) * 1.2 || 25000;

  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <Card className="h-full min-w-0 rounded-xl border-border/50 p-6 shadow-none">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Ventas por Semana</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Tendencia de facturación de las últimas semanas del mes.
          </CardDescription>
          <CardAction>
            <Link href={routePaths.sales} className={buttonVariants({ variant: "secondary" })} style={{ fontSize: "11px" }}>
              Ver ventas
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="h-[210px] flex items-end justify-between gap-3 p-0 px-6 pb-6 pt-6">
          {weeklySales.map((item, idx) => {
            const barHeightPct = maxVal > 0 ? (item.amount / maxVal) * 100 : 0;

            return (
              <div
                key={idx}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ position: "relative" }}
              >
                {hoveredBar === idx ? (
                  <div className="absolute -top-8 z-10 whitespace-nowrap rounded-lg border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md transition-all duration-150">
                    <div className="font-bold">${item.amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                ) : null}
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className="w-full rounded-t-[4px] bg-[#FF5C00] transition-all duration-200 group-hover:bg-[#FF5C00]/80"
                    style={{ height: `${barHeightPct}%`, minHeight: barHeightPct > 0 ? "4px" : "0px" }}
                  />
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">Sem {idx + 1}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="h-full min-w-0 rounded-xl border-border/50 p-6 shadow-none">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Últimas Compras</CardTitle>
          <CardAction>
            <Link href={routePaths.purchases} className={buttonVariants({ variant: "secondary" })} style={{ fontSize: "11px" }}>
              Ver compras
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="h-full p-0">
          <div className="flex flex-col divide-y divide-border">
            {recentPurchases.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">No hay compras registradas recientemente.</p>
            ) : (
              recentPurchases.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-accent">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {item.supplierName?.substring(0, 2).toUpperCase() || "SC"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium leading-none text-foreground">{item.supplierName}</div>
                      <div className="text-[11px] text-muted-foreground">{new Date(item.date).toLocaleDateString("es-AR")}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
                      {item.voucherTypeName || "Factura"}
                    </span>
                    <div className="font-mono text-sm font-medium text-red-500">
                      -${item.totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
