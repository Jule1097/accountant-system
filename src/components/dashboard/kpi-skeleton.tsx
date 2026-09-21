import { Skeleton } from "src/components/ui/skeleton"

export function KpiCardsSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="flex-1 rounded-xl border border-border/50 bg-card p-5">
          <div className="pb-4"><Skeleton className="h-4 w-32" /></div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-full max-w-[220px]" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
