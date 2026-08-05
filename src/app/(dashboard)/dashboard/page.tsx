import { KpiCards } from "src/components/dashboard/kpi-cards";
import { RecentActivity } from "src/components/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Resumen general del estado financiero de tu empresa.
          </p>
        </div>
      </div>
      <KpiCards />
      <RecentActivity />
    </div>
  );
}
