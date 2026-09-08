"use client"

import { AlertCircle, Inbox, LoaderCircle } from "lucide-react"
import { Button } from "src/components/ui/button"
import { dataTableStateMessages } from "src/lib/constants/data-table"
import type { DataTableStateProps } from "src/types/shared/data-table"

const stateIcons = {
  loading: LoaderCircle,
  empty: Inbox,
  error: AlertCircle,
} as const

export function DataTableState({ variant, message, actionLabel = dataTableStateMessages.retry, onAction }: DataTableStateProps) {
  const Icon = stateIcons[variant]

  return (
    <div className="flex items-center justify-center gap-2">
      <Icon className={variant === "loading" ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
      <span>{message}</span>
      {variant === "error" && onAction ? <Button type="button" variant="outline" size="sm" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  )
}
