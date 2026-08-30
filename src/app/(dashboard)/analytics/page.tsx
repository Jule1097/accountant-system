import { Suspense } from "react";
import { AnalyticsSkeleton } from "src/components/analytics/analytics-skeleton";
import { AnalyticsView } from "src/components/analytics/analytics-view";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsView />
    </Suspense>
  );
}
