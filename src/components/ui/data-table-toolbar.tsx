"use client";

import type { ReactNode } from "react";
import { cn } from "src/lib/shared/utils";

interface DataTableToolbarProps {
  summary?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DataTableToolbar({ summary, actions, className }: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="text-sm text-muted-foreground">{summary}</div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>
    </div>
  );
}
