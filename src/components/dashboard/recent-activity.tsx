"use client";

import { useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "src/components/ui/card";
import { cn } from "src/lib/utils";
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

  const width = 450;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const maxVal = Math.max(...weeklySales.map(s => s.amount)) * 1.2 || 25000;

  const getX = (idx: number) => paddingX + idx * 75;
  const getBarHeight = (val: number) => (val / maxVal) * (height - 2 * paddingY);
  const getY = (val: number) => height - paddingY - getBarHeight(val);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Ventas por Semana</CardTitle>
          <CardDescription>
            Tendencia de facturación de las últimas semanas del mes.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[210px] flex items-center justify-center relative">
          <div className="w-full h-full relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
              <line
                x1={paddingX}
                y1={height - paddingY}
                x2={width - 20}
                y2={height - paddingY}
                className="stroke-muted-foreground/20 stroke-1"
              />
              <line
                x1={paddingX}
                y1={paddingY}
                x2={width - 20}
                y2={paddingY}
                className="stroke-muted-foreground/10 stroke-1 stroke-dasharray-[4_4]"
              />

              <text x={paddingX - 8} y={paddingY + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                ${maxVal > 1000 ? (maxVal/1000).toFixed(0) + 'k' : maxVal.toFixed(0)}
              </text>
              <text x={paddingX - 8} y={height - paddingY + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                $0
              </text>

              {weeklySales.map((item, idx) => (
                <g key={idx}>
                  <rect
                    x={getX(idx) + 12}
                    y={getY(item.amount)}
                    width="26"
                    height={getBarHeight(item.amount)}
                    rx="3"
                    className={cn(
                      "fill-emerald-500/80 transition-all duration-200 cursor-pointer",
                      hoveredBar === idx ? "fill-emerald-500" : ""
                    )}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                  <text
                    x={getX(idx) + 25}
                    y={height - paddingY + 14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px] font-medium"
                  >
                    Sem {idx + 1}
                  </text>
                </g>
              ))}
            </svg>

            {hoveredBar !== null && (
              <div
                className="absolute bg-popover text-popover-foreground border rounded-lg shadow-md px-2 py-1 text-2xs pointer-events-none transition-all duration-150 z-10"
                style={{
                  left: `${getX(hoveredBar) + 40}px`,
                  top: `${getY(weeklySales[hoveredBar].amount) - 15}px`,
                }}
              >
                <div className="font-bold">${weeklySales[hoveredBar].amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Últimas Compras</CardTitle>
          <CardDescription>
            Listado de las compras cargadas recientemente en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPurchases.length === 0 ? (
              <p className="text-2xs text-muted-foreground">No hay compras registradas recientemente.</p>
            ) : (
              recentPurchases.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3.5 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="text-2xs font-bold leading-none">{item.supplier?.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("es-AR")} • {item.voucherType?.name || "Factura"}
                    </div>
                  </div>
                  <div className="text-2xs font-bold text-rose-500">
                    -${Number(item.totalAmount).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
