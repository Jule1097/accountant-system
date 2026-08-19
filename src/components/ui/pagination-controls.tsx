"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "src/components/ui/button";
import { buildPaginationItems } from "src/lib/helpers/pagination";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageLabel: string;
  pageSizeOptions: readonly number[];
  pageSizeAriaLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  pageLabel,
  pageSizeOptions,
  pageSizeAriaLabel,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const items = buildPaginationItems(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-muted-foreground">{pageLabel}</div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label={pageSizeAriaLabel}
          className="flex h-9 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5C00]"
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {`Mostrar: ${option}`}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {items.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === currentPage ? "default" : "outline"}
                className={item === currentPage
                  ? "min-w-10 h-8 border-[#FF5C00] bg-[#FF5C00] text-[#FFFFFF] hover:bg-[#FF8A4C]"
                  : "min-w-10 h-8 border-input bg-card text-foreground hover:bg-muted"}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            )
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
