import type { ReactNode } from "react";

export type DataTableStateVariant = "loading" | "empty" | "error";

export interface DataTableStateProps {
  variant: DataTableStateVariant;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface DataTableProps<TData> {
  data: readonly TData[];
  columns: readonly DataTableColumn<TData>[];
  getRowId: (row: TData, index: number) => string | number;
  isLoading?: boolean;
  loadingState?: ReactNode;
  errorState?: ReactNode;
  emptyState?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export interface DataTableCellContext<TData> {
  row: TData;
  value: ReactNode;
}

export interface DataTableColumn<TData> {
  id: string;
  header: ReactNode;
  accessor?: (row: TData) => ReactNode;
  cell?: (context: DataTableCellContext<TData>) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}
