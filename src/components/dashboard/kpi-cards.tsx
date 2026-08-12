"use client";

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { DollarSign, CreditCard } from "lucide-react";
import { AnalyticsData } from "src/types/analytics";
import { cn } from "src/lib/utils";

interface KpiCardsProps {
  promise: Promise<AnalyticsData> | null;
}

export function KpiCards({ promise }: KpiCardsProps) {
  if (!promise) return null;
  const data = use(promise);

  if (!data) return null;

  const trend = data.trend?.ARS || [];

  const currentMonthIdx = trend.length - 1;
  const currentMonthData = currentMonthIdx >= 0 ? trend[currentMonthIdx] : { income: 0, expenses: 0 };
  const prevMonthData = currentMonthIdx > 0 ? trend[currentMonthIdx - 1] : { income: 0, expenses: 0 };

  const currentIncome = currentMonthData.income;
  const prevIncome = prevMonthData.income;
  const incomeDiff = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;

  const currentExpenses = currentMonthData.expenses;
  const prevExpenses = prevMonthData.expenses;
  const expensesDiff = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-xl p-5 shadow-none border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Ingresos del mes
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl font-mono font-medium tracking-tight text-foreground">
            $ {currentIncome.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-4 flex items-center gap-1">
            <span className={cn("text-xs font-medium", incomeDiff >= 0 ? "text-green-500" : "text-red-500")}>
              {incomeDiff > 0 ? "+" : ""}{incomeDiff.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">respecto al mes anterior</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl p-5 shadow-none border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Egresos del mes
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl font-mono font-medium tracking-tight text-foreground">
            $ {currentExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-4 flex items-center gap-1">
            <span className={cn("text-xs font-medium", expensesDiff >= 0 ? "text-green-500" : "text-red-500")}>
              {expensesDiff > 0 ? "+" : ""}{expensesDiff.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">respecto al mes anterior</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
