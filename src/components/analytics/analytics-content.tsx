"use client";

import { useState } from "react";
import { AnalyticsComparisonTable } from "src/components/analytics/analytics-comparison-table";
import { AnalyticsExpenseDistribution } from "src/components/analytics/analytics-expense-distribution";
import { AnalyticsHeader, type AnalyticsCurrency, type AnalyticsPeriod } from "src/components/analytics/analytics-header";
import { AnalyticsSummaryCards } from "src/components/analytics/analytics-summary-cards";
import { AnalyticsTrendSection } from "src/components/analytics/analytics-trend-section";
import { AnalyticsSkeleton } from "src/components/analytics/analytics-skeleton";
import { useAnalytics } from "src/hooks/analytics/use-analytics";
import { useAnalyticsChart } from "src/hooks/analytics/use-analytics-chart";
import type { AnalyticsData } from "src/types/analytics/analytics";

function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("6_months");
  const [currency, setCurrency] = useState<AnalyticsCurrency>("ARS");
  const { activeData, maxVal, salesVal, totalMonthlyExpenses, marginPercentage, expenseCategories, getCategoryOffset, comparisons } = useAnalyticsChart(data, currency, period);

  return (
    <div className="flex-1 space-y-6 overflow-hidden box-border">
      <AnalyticsHeader currency={currency} period={period} onCurrencyChange={setCurrency} onPeriodChange={setPeriod} />
      <AnalyticsSummaryCards currency={currency} salesValue={salesVal} totalExpenses={totalMonthlyExpenses} marginPercentage={marginPercentage} />
      <AnalyticsTrendSection activeData={activeData} currency={currency} maxValue={maxVal} />
      <div className="flex flex-col lg:flex-row gap-4 w-full items-stretch pb-10">
        <AnalyticsExpenseDistribution currency={currency} categories={expenseCategories} getCategoryOffset={getCategoryOffset} />
        <AnalyticsComparisonTable currency={currency} comparisons={comparisons} />
      </div>
    </div>
  );
}

export function AnalyticsContent() {
  const { data, isLoading } = useAnalytics({ suspense: false });

  if (isLoading || !data) {
    return <AnalyticsSkeleton />;
  }

  return <AnalyticsDashboard data={data} />;
}
