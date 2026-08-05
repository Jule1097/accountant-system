"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "src/components/ui/card";
import { cn } from "src/lib/utils";

const weeklySales = [
  { week: "Semana 1", amount: 12400 },
  { week: "Semana 2", amount: 18900 },
  { week: "Semana 3", amount: 14200 },
  { week: "Semana 4", amount: 22100 },
  { week: "Semana 5", amount: 16800 },
];

const recentPurchases = [
  { id: "1", date: "2026-08-03", type: "Factura A", provider: "Proveedor Central", total: 4500.00 },
  { id: "2", date: "2026-08-01", type: "Ticket", provider: "Librería", total: 150.75 },
  { id: "3", date: "2026-07-28", type: "Factura B", provider: "Servicios Públicos", total: 1200.00 },
];

export function RecentActivity() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const width = 450;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const maxVal = 25000;

  const getX = (idx: number) => {
    return paddingX + idx * 75;
  };

  const getBarHeight = (val: number) => {
    return (val / maxVal) * (height - 2 * paddingY);
  };

  const getY = (val: number) => {
    return height - paddingY - getBarHeight(val);
  };

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
                $25k
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
                <div className="font-bold">${weeklySales[hoveredBar].amount.toLocaleString("es-AR")}</div>
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
            {recentPurchases.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3.5 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <div className="text-2xs font-bold leading-none">{item.provider}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.date} • {item.type}
                  </div>
                </div>
                <div className="text-2xs font-bold text-rose-500">
                  -${item.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
