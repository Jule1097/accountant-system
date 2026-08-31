"use client";

import { ReactNode } from "react";
import { DashboardSkeleton } from "src/components/dashboard/dashboard-skeleton";
import { useCompany } from "src/contexts/company-context";
import { KpiCards } from "src/components/dashboard/kpi-cards";
import { RecentActivity } from "src/components/dashboard/recent-activity";
import { useAnalytics } from "src/hooks/analytics/use-analytics";
import { useDashboardActivity } from "src/hooks/dashboard/use-dashboard-activity";

function DashboardShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">Dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">Resumen general del estado financiero de tu empresa.</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function DashboardDataSections() {
  const { data: analytics, isLoading: isAnalyticsLoading } = useAnalytics({ suspense: false });
  const { data: recentActivity, isLoading: isRecentActivityLoading } = useDashboardActivity({ suspense: false });

  if (isAnalyticsLoading || isRecentActivityLoading || !analytics || !recentActivity) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <KpiCards data={analytics} />
      <RecentActivity data={recentActivity} />
    </>
  );
}

export function DashboardView() {
  const { activeCompanyId, loading } = useCompany();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!activeCompanyId) {
    return <DashboardShell />;
  }

  return (
    <DashboardShell>
      <DashboardDataSections />
    </DashboardShell>
  );
}
