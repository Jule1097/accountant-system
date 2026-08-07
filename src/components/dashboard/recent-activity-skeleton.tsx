import { Skeleton } from "src/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "src/components/ui/card";

export function RecentActivitySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent className="h-[210px] flex items-end justify-between px-6 pb-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <Skeleton className={`w-6 rounded-t-sm ${idx % 2 === 0 ? 'h-24' : 'h-32'}`} />
              <Skeleton className="h-2 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card className="col-span-3">
        <CardHeader>
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mt-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-4 space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
