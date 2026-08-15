"use client";

import { KpiCards } from "src/components/dashboard/kpi-cards";
import { KpiCardsSkeleton } from "src/components/dashboard/kpi-skeleton";
import { RecentActivity } from "src/components/dashboard/recent-activity";
import { RecentActivitySkeleton } from "src/components/dashboard/recent-activity-skeleton";
import { useAnalytics } from "src/hooks/use-analytics";
import { useVouchers } from "src/hooks/use-vouchers";

const salesQuery = {
  page: 1,
  pageSize: 50,
  sortBy: "date" as const,
  sortOrder: "desc" as const,
  voucherId: null,
};

const purchasesQuery = {
  page: 1,
  pageSize: 10,
  sortBy: "date" as const,
  sortOrder: "desc" as const,
  voucherId: null,
};

export default function DashboardPage() {
  const { data: analytics, isLoading: isAnalyticsLoading } = useAnalytics();
  const { data: sales, isLoading: isSalesLoading } = useVouchers("sale", salesQuery);
  const { data: purchases, isLoading: isPurchasesLoading } = useVouchers("purchase", purchasesQuery);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-2">Resumen general del estado financiero de tu empresa.</p>
        </div>
      </div>

      {isAnalyticsLoading || !analytics ? <KpiCardsSkeleton /> : <KpiCards data={analytics} />}

      {isSalesLoading || !sales || isPurchasesLoading || !purchases ? (
        <RecentActivitySkeleton />
      ) : (
        <RecentActivity sales={sales} purchases={purchases} />
      )}
    </div>
  );
}
