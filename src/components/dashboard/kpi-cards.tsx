"use client";

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { DollarSign, CreditCard, Activity } from "lucide-react";
import { AnalyticsData } from "src/types/analytics";

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
  
  const currentBalance = currentIncome - currentExpenses;
  const prevBalance = prevIncome - prevExpenses;
  const balanceDiff = prevBalance > 0 ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos del mes
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            $ {currentIncome.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {incomeDiff > 0 ? "+" : ""}{incomeDiff.toFixed(1)}% respecto al mes anterior
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Egresos del mes
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            $ {currentExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {expensesDiff > 0 ? "+" : ""}{expensesDiff.toFixed(1)}% respecto al mes anterior
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Balance
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            $ {currentBalance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {balanceDiff > 0 ? "+" : ""}{balanceDiff.toFixed(1)}% respecto al mes anterior
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
