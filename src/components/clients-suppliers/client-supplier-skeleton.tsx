"use client"

import { Skeleton } from "src/components/ui/skeleton"

export function ClientSupplierSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex w-full gap-4 border-b border-border/40">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="rounded-xl border border-border/50 bg-card px-4 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <Skeleton className="h-9 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card px-4 py-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
