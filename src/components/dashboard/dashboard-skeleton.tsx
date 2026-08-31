import { KpiCardsSkeleton } from "src/components/dashboard/kpi-skeleton";
import { RecentActivitySkeleton } from "src/components/dashboard/recent-activity-skeleton";
import { Skeleton } from "src/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6" data-testid="dashboard-page-skeleton">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>
      <KpiCardsSkeleton />
      <RecentActivitySkeleton />
    </div>
  );
}
