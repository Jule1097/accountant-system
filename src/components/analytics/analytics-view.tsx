"use client";

import { useState, Suspense, use } from "react";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Target,
  ArrowDownRight,
  Percent,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { Button } from "src/components/ui/button";
import { AnalyticsSkeleton } from "src/components/analytics/analytics-skeleton";
import { cn } from "src/lib/utils";
import { useAnalytics } from "src/hooks/use-analytics";
import { useAnalyticsChart } from "src/hooks/use-analytics-chart";
import { AnalyticsData, TrendEntry, ComparisonPeriodData, TopPartyEntry } from "src/types/analytics";

function AnalyticsContainer({ promise }: { promise: Promise<AnalyticsData> }) {

  const [period, setPeriod] = useState<"6_months" | "year">("6_months");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const data = use(promise);
  const { annual } = data;

  const {
    activeData,
    width,
    height,
    paddingX,
    paddingY,
    maxVal,
    getX,
    getY,
    incomePath,
    expensesPath,
    incomeAreaPath,
    expensesAreaPath,
    salesVal,
    purchasesVal,
    totalMonthlyExpenses,
    marginPercentage,
    expenseCategories,
    getCategoryOffset,
    comparisons,
  } = useAnalyticsChart(data, currency, period);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analíticas</h2>
          <p className="text-sm text-muted-foreground">
            Métricas de proyección y tendencias de ingresos y egresos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-background">
            <Button
              variant={currency === "ARS" ? "default" : "ghost"}
              size="xs"
              className="h-7 text-3xs px-2"
              onClick={() => setCurrency("ARS")}
            >
              ARS ($)
            </Button>
            <Button
              variant={currency === "USD" ? "default" : "ghost"}
              size="xs"
              className="h-7 text-3xs px-2"
              onClick={() => setCurrency("USD")}
            >
              USD
            </Button>
          </div>

          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-background">
            <Button
              variant={period === "6_months" ? "default" : "ghost"}
              size="xs"
              className="h-7 text-3xs px-2"
              onClick={() => setPeriod("6_months")}
            >
              Últimos 6 meses
            </Button>
            <Button
              variant={period === "year" ? "default" : "ghost"}
              size="xs"
              className="h-7 text-3xs px-2"
              onClick={() => setPeriod("year")}
            >
              Año completo
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency === "USD" ? "USD" : "$"} {salesVal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-2 text-2xs text-muted-foreground leading-relaxed">
              Total de ventas netas registradas en los últimos 30 días.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos del Mes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency === "USD" ? "USD" : "$"} {totalMonthlyExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-2 text-2xs text-muted-foreground leading-relaxed">
              Compras netas, percepciones e IVA de los últimos 30 días.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Neto Mensual</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marginPercentage}%</div>
            <p className="mt-2 text-2xs text-muted-foreground leading-relaxed">
              Rentabilidad relativa de ingresos frente a egresos.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punto de Equilibrio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency === "USD" ? "USD" : "$"} {purchasesVal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-2 text-2xs text-muted-foreground leading-relaxed">
              Ventas mínimas requeridas para cubrir costos operativos.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 relative">
          <CardHeader>
            <CardTitle>Tendencia de Ingresos y Egresos</CardTitle>
            <CardDescription>
              Representación de la facturación y gastos mensuales del período seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center relative">
            {activeData.length === 0 ? (
              <p className="text-2xs text-muted-foreground">No hay datos suficientes para graficar.</p>
            ) : (
              <div className="w-full h-full relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line
                    x1={paddingX}
                    y1={height - paddingY}
                    x2={width - paddingX}
                    y2={height - paddingY}
                    className="stroke-muted-foreground/20 stroke-1"
                  />
                  <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={width - paddingX}
                    y2={paddingY}
                    className="stroke-muted-foreground/10 stroke-1 stroke-dasharray-[4_4]"
                  />
                  <line
                    x1={paddingX}
                    y1={paddingY + (height - 2 * paddingY) / 2}
                    x2={width - paddingX}
                    y2={paddingY + (height - 2 * paddingY) / 2}
                    className="stroke-muted-foreground/10 stroke-1 stroke-dasharray-[4_4]"
                  />

                  <text
                    x={paddingX - 10}
                    y={paddingY + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {currency === "USD" ? "U$S" : "$"}{Math.round(maxVal / 1000)}k
                  </text>
                  <text
                    x={paddingX - 10}
                    y={paddingY + (height - 2 * paddingY) / 2 + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {currency === "USD" ? "U$S" : "$"}{Math.round(maxVal / 2000)}k
                  </text>
                  <text
                    x={paddingX - 10}
                    y={height - paddingY + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
                  >
                    $0
                  </text>

                  {activeData.map((d: TrendEntry, idx: number) => (
                    <text
                      key={idx}
                      x={getX(idx)}
                      y={height - paddingY + 20}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px] font-medium"
                    >
                      {d.month}
                    </text>
                  ))}

                  <path d={incomeAreaPath} fill="url(#incomeGrad)" />
                  <path d={expensesAreaPath} fill="url(#expensesGrad)" />

                  <path
                    d={incomePath}
                    fill="none"
                    className="stroke-emerald-500 stroke-2.5 transition-all duration-300"
                  />
                  <path
                    d={expensesPath}
                    fill="none"
                    className="stroke-rose-500 stroke-2.5 transition-all duration-300"
                  />

                  {activeData.map((d: TrendEntry, idx: number) => (
                    <g key={idx}>
                      <circle
                        cx={getX(idx)}
                        cy={getY(d.income)}
                        r={hoveredIndex === idx ? 6 : 4}
                        className={cn(
                          "fill-emerald-500 transition-all duration-150 stroke-background stroke-2",
                          hoveredIndex === idx ? "scale-125" : ""
                        )}
                      />
                      <circle
                        cx={getX(idx)}
                        cy={getY(d.expenses)}
                        r={hoveredIndex === idx ? 6 : 4}
                        className={cn(
                          "fill-rose-500 transition-all duration-150 stroke-background stroke-2",
                          hoveredIndex === idx ? "scale-125" : ""
                        )}
                      />
                    </g>
                  ))}

                  {hoveredIndex !== null && (
                    <line
                      x1={getX(hoveredIndex)}
                      y1={paddingY}
                      x2={getX(hoveredIndex)}
                      y2={height - paddingY}
                      className="stroke-muted-foreground/35 stroke-1 stroke-dasharray-[2_2] pointer-events-none"
                    />
                  )}

                  {activeData.map((d: TrendEntry, idx: number) => {
                    const stepX = (width - 2 * paddingX) / (activeData.length - 1);
                    const zoneWidth = idx === 0 || idx === activeData.length - 1 ? stepX / 2 : stepX;
                    const zoneX = idx === 0 ? paddingX : getX(idx) - stepX / 2;

                    return (
                      <rect
                        key={idx}
                        x={zoneX}
                        y={paddingY}
                        width={zoneWidth}
                        height={height - 2 * paddingY}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  })}
                </svg>

                {hoveredIndex !== null && activeData[hoveredIndex] && (
                  <div
                    className="absolute bg-popover text-popover-foreground border rounded-lg shadow-md p-3 text-2xs pointer-events-none transition-all duration-150 flex flex-col gap-1 w-44 z-10"
                    style={{
                      left: `${Math.min(getX(hoveredIndex) + 15, width - 190)}px`,
                      top: `${Math.max(getY(activeData[hoveredIndex].income) - 10, 10)}px`,
                    }}
                  >
                    <div className="font-bold border-b pb-1 mb-1 text-[11px]">
                      Periodo: {activeData[hoveredIndex].month}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-500 font-medium">Ingresos:</span>
                      <span className="font-bold">
                        {currency === "USD" ? "USD" : "$"} {activeData[hoveredIndex].income.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-500 font-medium">Egresos:</span>
                      <span className="font-bold">
                        {currency === "USD" ? "USD" : "$"} {activeData[hoveredIndex].expenses.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-1 mt-1">
                      <span className="font-medium">Balance:</span>
                      <span
                        className={cn(
                          "font-bold",
                          activeData[hoveredIndex].income - activeData[hoveredIndex].expenses >= 0
                            ? "text-emerald-500"
                            : "text-rose-500"
                        )}
                      >
                        {currency === "USD" ? "USD" : "$"} {(activeData[hoveredIndex].income - activeData[hoveredIndex].expenses).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Egresos</CardTitle>
            <CardDescription>Clasificación según los egresos totales de este mes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-[320px] pb-6">
            {expenseCategories.length === 0 ? (
              <p className="text-2xs text-muted-foreground text-center py-12">No hay gastos en este mes.</p>
            ) : (
              <>
                <div className="flex justify-center items-center h-32 relative">
                  <svg viewBox="0 0 120 120" className="w-28 h-28 transform -rotate-90">
                    {expenseCategories.map((c, idx) => (
                      <circle
                        key={idx}
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke={c.color}
                        strokeWidth={hoveredCategory === c.category ? "12" : "8"}
                        strokeDasharray={`${(c.percentage / 100) * 314.16} 314.16`}
                        strokeDashoffset={getCategoryOffset(idx)}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(c.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    ))}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">
                      {hoveredCategory
                        ? `${expenseCategories.find((c) => c.category === hoveredCategory)?.percentage}%`
                        : "100%"}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[90px] text-center">
                      {hoveredCategory || "Total"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-4 max-h-[140px] overflow-auto">
                  {expenseCategories.map((c, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between p-1.5 rounded-lg transition-all duration-150",
                        hoveredCategory === c.category ? "bg-muted" : ""
                      )}
                      onMouseEnter={() => setHoveredCategory(c.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-2xs font-semibold truncate max-w-[120px]">{c.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xs font-bold">
                          {currency === "USD" ? "USD" : "$"} {c.amount.toLocaleString("es-AR")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{c.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparación Mensual vs Período Anterior</CardTitle>
          <CardDescription>
            Detalle comparativo del margen neto de rentabilidad de los últimos períodos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-left text-2xs">
              <thead>
                <tr className="border-b">
                  <th className="py-2.5 font-semibold text-muted-foreground">Período</th>
                  <th className="py-2.5 font-semibold text-muted-foreground">Ingresos</th>
                  <th className="py-2.5 font-semibold text-muted-foreground">Egresos</th>
                  <th className="py-2.5 font-semibold text-muted-foreground">Margen Rentabilidad</th>
                  <th className="py-2.5 font-semibold text-muted-foreground text-right">Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparisons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No hay datos suficientes para comparar.
                    </td>
                  </tr>
                ) : (
                  comparisons.map((c: ComparisonPeriodData, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 font-semibold">{c.month}</td>
                      <td className="py-3">
                        {currency === "USD" ? "USD" : "$"} {c.income.toLocaleString("es-AR")}
                      </td>
                      <td className="py-3">
                        {currency === "USD" ? "USD" : "$"} {c.expenses.toLocaleString("es-AR")}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${Math.max(0, c.margin)}%` }} />
                          </div>
                          <span className="font-medium">{c.margin}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        {c.status === "up" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-500">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Alza
                          </span>
                        )}
                        {c.status === "down" && (
                          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-500">
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                            Baja
                          </span>
                        )}
                        {c.status === "stable" && (
                          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-500">
                            Estable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Concentración de Clientes</CardTitle>
            <CardDescription>Top 5 clientes con mayor volumen de facturación en el período anual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {annual.topClients.length === 0 ? (
                <p className="text-2xs text-muted-foreground text-center py-4">No hay datos de clientes.</p>
              ) : (
                annual.topClients.map((c: TopPartyEntry, idx: number) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-semibold text-2xs">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">CUIT: {c.cuit}</span>
                    </div>
                    <span className="font-bold text-2xs">
                      {currency === "USD" ? "USD" : "$"} {c.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Concentración de Proveedores</CardTitle>
            <CardDescription>Top 5 proveedores con mayor volumen de compras en el período anual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {annual.topSuppliers.length === 0 ? (
                <p className="text-2xs text-muted-foreground text-center py-4">No hay datos de proveedores.</p>
              ) : (
                annual.topSuppliers.map((s: TopPartyEntry, idx: number) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-semibold text-2xs">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">CUIT: {s.cuit}</span>
                    </div>
                    <span className="font-bold text-2xs">
                      {currency === "USD" ? "USD" : "$"} {s.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AnalyticsView() {
  const { promise } = useAnalytics();

  if (!promise) {
    return <AnalyticsSkeleton />;
  }

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContainer promise={promise} />
    </Suspense>
  );
}

