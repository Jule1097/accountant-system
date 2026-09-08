"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "src/components/ui/table";
import { cn } from "src/lib/shared/utils";
import type { DataTableProps } from "src/types/shared/data-table";

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  isLoading = false,
  loadingState = null,
  errorState = null,
  emptyState = null,
  footer = null,
  className,
}: DataTableProps<TData>) {
  const colSpan = Math.max(columns.length, 1);

  return (
    <div className={cn("overflow-hidden rounded-[12px] border border-border bg-card", className)}>
      <Table className="text-[13px] text-foreground">
        <TableHeader className="bg-muted/30">
          <TableRow className="border-b-border hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn("text-[11px] font-semibold tracking-[0.5px] text-muted-foreground", column.headerClassName)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        {isLoading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                {loadingState}
              </TableCell>
            </TableRow>
          </TableBody>
        ) : errorState ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                {errorState}
              </TableCell>
            </TableRow>
          </TableBody>
        ) : data.length === 0 ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                {emptyState}
              </TableCell>
            </TableRow>
          </TableBody>
        ) : (
          <TableBody>
            {data.map((row, index) => {
              const rowId = getRowId(row, index);

              return (
                <TableRow
                  key={rowId}
                  data-row-id={String(rowId)}
                  className="border-b-border bg-card transition-colors hover:bg-muted/30"
                >
                  {columns.map((column) => {
                    const value = column.accessor ? column.accessor(row) : null;

                    return (
                      <TableCell key={column.id} className={column.cellClassName}>
                        {column.cell ? column.cell({ row, value }) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
      {footer}
    </div>
  );
}
