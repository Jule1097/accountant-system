"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { cn } from "src/lib/shared/utils";

export interface ResourceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  sidePanel?: ReactNode;
  isLoading?: boolean;
  loadingState?: ReactNode;
  size?: "default" | "wide";
  className?: string;
}

const resourceModalSizeClasses = {
  default: "sm:max-w-[720px]",
  wide: "sm:max-w-[1180px]",
} as const;

export function ResourceModal({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  sidePanel,
  isLoading = false,
  loadingState = null,
  size = "default",
  className,
}: ResourceModalProps) {
  const content = isLoading ? loadingState : children;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-h-[90vh] overflow-y-auto", resourceModalSizeClasses[size], className)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {sidePanel ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(500px,560px)]">
            <div className="min-w-0">{content}</div>
            <div className="min-w-0 lg:sticky lg:top-0">{sidePanel}</div>
          </div>
        ) : (
          content
        )}
        {footer ? <div className="pt-2">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
