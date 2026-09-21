import { Card, CardAction, CardContent, CardHeader } from "src/components/ui/card";
import { Skeleton } from "src/components/ui/skeleton";

export function RecentActivitySkeleton() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <Card className="h-full min-w-0 rounded-xl border-border/50 p-6 shadow-none">
        <CardHeader className="p-0 pb-4">
          <div>
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <CardAction>
            <Skeleton className="h-6 w-20" />
          </CardAction>
        </CardHeader>
        <CardContent className="h-[210px] flex items-end justify-between gap-3 p-0 px-6 pb-6 pt-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-full w-full items-end justify-center">
                <Skeleton className={`w-full rounded-t-[4px] ${idx % 2 === 0 ? "h-[40%]" : "h-[75%]"}`} />
              </div>
              <Skeleton className="mt-1 h-[14px] w-10" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="h-full min-w-0 rounded-xl border-border/50 p-6 shadow-none">
        <CardHeader className="p-0 pb-4">
          <Skeleton className="h-5 w-48" />
          <CardAction>
            <Skeleton className="h-6 w-20" />
          </CardAction>
        </CardHeader>
        <CardContent className="h-full p-0">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
