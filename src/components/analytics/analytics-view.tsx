"use client";

import { AnalyticsContent } from "src/components/analytics/analytics-content";
import { AnalyticsHeader } from "src/components/analytics/analytics-header";
import { AnalyticsSkeleton } from "src/components/analytics/analytics-skeleton";
import { useCompany } from "src/contexts/company-context";

export function AnalyticsView() {
  const { activeCompanyId, loading } = useCompany();

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (!activeCompanyId) {
    return (
      <div className="flex-1 space-y-6 overflow-hidden box-border">
        <AnalyticsHeader showControls={false} />
      </div>
    );
  }

  return <AnalyticsContent />;
}
