import { Suspense } from "react";
import { DashboardSkeleton } from "src/components/dashboard/dashboard-skeleton";
import { DashboardView } from "src/components/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
