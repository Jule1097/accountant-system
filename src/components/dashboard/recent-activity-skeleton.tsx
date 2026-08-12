import { Skeleton } from "src/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "src/components/ui/card";

export function RecentActivitySkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full">
      <Card className="rounded-xl p-6 shadow-none border-border/50">
        <CardHeader className="p-0 pb-4">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent className="h-[210px] flex items-end justify-between p-0 pt-6 px-6 pb-6 gap-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex flex-col flex-1 items-center justify-end gap-2 h-full">
              <div className="w-full flex items-end justify-center h-full">
                <Skeleton className={`w-full rounded-t-[4px] ${idx % 2 === 0 ? 'h-[40%]' : 'h-[75%]'}`} />
              </div>
              <Skeleton className="h-[14px] w-10 mt-1" />
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between pb-2">
          <Skeleton className="h-5 w-48 mb-2" />
        </div>
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
      </div>
    </div>
  );
}
