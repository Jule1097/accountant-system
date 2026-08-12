import { Skeleton } from "src/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "src/components/ui/card";

export function KpiCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, idx) => (
        <Card key={idx} className="rounded-xl p-5 shadow-none border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent className="p-0">
            <Skeleton className="h-8 w-32 mb-2 mt-2" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
