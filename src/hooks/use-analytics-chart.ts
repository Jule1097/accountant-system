import { useMemo } from "react";
import { AnalyticsData, TrendEntry, TaxBreakdownEntry } from "src/types/analytics";

export function useAnalyticsChart(data: AnalyticsData, currency: "ARS" | "USD", period: "6_months" | "year") {
  return useMemo(() => {
    const { monthly, trend } = data;

    const currentTrend = trend[currency] || [];
    const activeData = period === "6_months" ? currentTrend.slice(-6) : currentTrend.slice(-12);

    const width = 600;
    const height = 280;
    const paddingX = 50;
    const paddingY = 40;

    const maxVal = Math.max(...activeData.flatMap((d: TrendEntry) => [d.income, d.expenses])) * 1.15 || 1000;

    const getX = (index: number) => {
      if (activeData.length <= 1) return paddingX;
      return paddingX + (index / (activeData.length - 1)) * (width - 2 * paddingX);
    };

    const getY = (val: number) => {
      return height - paddingY - (val / maxVal) * (height - 2 * paddingY);
    };

    const buildPath = (dataValues: number[]) => {
      return dataValues
        .map((val, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(val)}`)
        .join(" ");
    };

    const incomePath = buildPath(activeData.map((d: TrendEntry) => d.income));
    const expensesPath = buildPath(activeData.map((d: TrendEntry) => d.expenses));

    const incomeAreaPath = activeData.length > 0
      ? `${incomePath} L ${getX(activeData.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
      : "";

    const expensesAreaPath = activeData.length > 0
      ? `${expensesPath} L ${getX(activeData.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
      : "";

    const netPurchasesVal = monthly.netPurchases[currency] || 0;
    const vatVal = monthly.vatCredit[currency] || 0;
    const perceptionsList = (monthly.perceptions || []).filter((perception: TaxBreakdownEntry) => perception.currency === currency);
    const perceptionsTotal = perceptionsList.reduce((sum: number, p: TaxBreakdownEntry) => sum + p.total, 0);

    const totalMonthlyExpenses = netPurchasesVal + vatVal + perceptionsTotal;

    const colors = ["#FF5C00", "#FF8A4C", "#6B6B70", "#ADADB0", "#3F3F46", "#18181B"];
    const categoriesList = [];

    if (netPurchasesVal > 0) {
      categoriesList.push({
        category: "Compras Netas",
        amount: netPurchasesVal,
        color: colors[0],
      });
    }

    if (vatVal > 0) {
      categoriesList.push({
        category: "Crédito Fiscal IVA",
        amount: vatVal,
        color: colors[1],
      });
    }

    perceptionsList.forEach((p: TaxBreakdownEntry, idx: number) => {
      categoriesList.push({
        category: p.concept,
        amount: p.total,
        color: colors[(idx + 2) % colors.length],
      });
    });

    const totalSum = categoriesList.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0) || 1;
    const expenseCategories = categoriesList.map((c) => ({
      ...c,
      percentage: Math.round((c.amount / totalSum) * 100),
    }));

    const getCategoryOffset = (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += expenseCategories[i].percentage;
      }
      return -(offset / 100) * 314.16;
    };

    const comparisons = currentTrend.slice(-4).map((t: TrendEntry, idx: number, arr: TrendEntry[]) => {
      const margin = t.income > 0 ? Math.round(((t.income - t.expenses) / t.income) * 100) : 0;
      let status: "up" | "down" | "stable" = "stable";
      if (idx > 0) {
        const prev = arr[idx - 1];
        const prevMargin = prev.income > 0 ? Math.round(((prev.income - prev.expenses) / prev.income) * 100) : 0;
        if (margin > prevMargin) status = "up";
        else if (margin < prevMargin) status = "down";
      }
      return {
        month: t.month,
        income: t.income,
        expenses: t.expenses,
        margin,
        status,
      };
    }).reverse();

    const salesVal = monthly.netSales[currency] || 0;
    const purchasesVal = monthly.netPurchases[currency] || 0;
    const marginPercentage = salesVal > 0 ? ((salesVal - purchasesVal) / salesVal * 100).toFixed(1) : "0.0";

    return {
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
    };
  }, [data, currency, period]);
}

