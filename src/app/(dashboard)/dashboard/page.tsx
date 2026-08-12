"use client";

import { Suspense } from "react";
import { KpiCards } from "src/components/dashboard/kpi-cards";
import { RecentActivity } from "src/components/dashboard/recent-activity";
import { KpiCardsSkeleton } from "src/components/dashboard/kpi-skeleton";
import { RecentActivitySkeleton } from "src/components/dashboard/recent-activity-skeleton";
import { useAnalytics } from "src/hooks/use-analytics";
import { useVouchers } from "src/hooks/use-vouchers";

export default function DashboardPage() {
  const { promise: analyticsPromise } = useAnalytics();
  const { promise: vouchersPromise } = useVouchers();

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Resumen general del estado financiero de tu empresa.
          </p>
        </div>
      </div>
      
      <Suspense fallback={<KpiCardsSkeleton />}>
        <KpiCards promise={analyticsPromise} />
      </Suspense>

      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivity promise={vouchersPromise} />
      </Suspense>
    </div>
  );
}
