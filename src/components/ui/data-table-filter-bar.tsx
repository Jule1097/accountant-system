"use client";

import type { ReactNode } from "react";
import { cn } from "src/lib/shared/utils";

interface DataTableFilterBarProps {
  children: ReactNode;
  className?: string;
}

export function DataTableFilterBar({ children, className }: DataTableFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {children}
    </div>
  );
}
