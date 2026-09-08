"use client";

import { DataTableClearFiltersButton } from "src/components/ui/data-table-clear-filters-button";
import { DataTableDateRangeFilter } from "src/components/ui/data-table-date-range-filter";
import { DataTableFilterBar } from "src/components/ui/data-table-filter-bar";
import { DataTableSearchFilter } from "src/components/ui/data-table-search-filter";
import { DataTableSelectFilter } from "src/components/ui/data-table-select-filter";
import { voucherSearchDebounceMs } from "src/lib/helpers/voucher/voucher-management";
import type { VoucherListQueryState, VoucherStatus } from "src/types/voucher/voucher";

interface VoucherTableFiltersProps {
  query: VoucherListQueryState;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onStatusChange: (value: VoucherStatus | undefined) => void;
  onDateRangeChange: (dateFrom: string, dateTo: string) => void;
}

const voucherStatusOptions = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "partial", label: "Parcial" },
  { value: "paid", label: "Pagado" },
] as const;

export function VoucherTableFilters({
  query,
  searchValue,
  onSearchChange,
  onClearFilters,
  onStatusChange,
  onDateRangeChange,
}: VoucherTableFiltersProps) {
  const hasActiveFilters = Boolean(query.search || query.status || query.dateFrom || query.dateTo);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-end md:justify-between">
      <DataTableFilterBar className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <DataTableSearchFilter
            id="voucher-search"
            label="Buscar"
            value={searchValue}
            placeholder="Buscar por nombre, CUIT..."
            onChange={onSearchChange}
          />
        </div>
        <DataTableSelectFilter
          id="voucher-status"
          label="Estado"
          value={query.status || ""}
          options={voucherStatusOptions}
          onChange={(value) => onStatusChange(value ? (value as VoucherStatus) : undefined)}
        />
        <DataTableDateRangeFilter
          id="voucher-date"
          from={query.dateFrom}
          to={query.dateTo}
          debounceMs={voucherSearchDebounceMs}
          onChange={onDateRangeChange}
        />
      </DataTableFilterBar>
      <div className="flex items-center gap-2 md:justify-end">
        <DataTableClearFiltersButton isVisible={hasActiveFilters} onClear={onClearFilters} />
      </div>
    </div>
  );
}
