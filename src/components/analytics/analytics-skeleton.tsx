import { Card, CardContent, CardHeader } from "src/components/ui/card";
import { Skeleton } from "src/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="flex-1 space-y-6 overflow-hidden box-border" data-testid="analytics-page-skeleton">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2 sm:mt-0">
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx} className="flex-1 rounded-xl border border-border/50 p-5 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="p-0">
              <Skeleton className="h-8 w-36 mb-3" />
              <Skeleton className="h-3 w-full max-w-[220px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl border border-border/50 p-6 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-5">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3 w-80 max-w-[40%]" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[180px] flex items-end gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex-1 h-full flex items-end gap-1">
                <Skeleton className={`flex-1 rounded-t-sm ${idx % 2 === 0 ? "h-[55%]" : "h-[35%]"}`} />
                <Skeleton className={`flex-1 rounded-t-sm ${idx % 2 === 0 ? "h-[30%]" : "h-[60%]"}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row gap-4 w-full items-stretch pb-10">
        <Card className="w-full lg:w-[380px] rounded-xl border border-border/50 p-5 shadow-none">
          <CardHeader className="p-0 pb-6">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex justify-center items-center h-[120px]">
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
            </div>
            <div className="space-y-3 mt-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 rounded-xl border border-border/50 p-5 shadow-none">
          <CardHeader className="p-0 pb-4">
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
              </div>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
