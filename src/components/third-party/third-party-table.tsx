"use client";

import { Button } from "src/components/ui/button";
import { DataTable } from "src/components/ui/data-table";
import { DataTableClearFiltersButton } from "src/components/ui/data-table-clear-filters-button";
import { DataTableFilterBar } from "src/components/ui/data-table-filter-bar";
import { DataTableSearchFilter } from "src/components/ui/data-table-search-filter";
import { DataTableToolbar } from "src/components/ui/data-table-toolbar";
import { DataTableState } from "src/components/ui/data-table-state";
import { PaginationControls } from "src/components/ui/pagination-controls";
import { createClientSupplierTableColumns } from "src/components/third-party/third-party-table-columns";
import { dataTableStateMessages } from "src/lib/constants/data-table";
import { buildClientSupplierPageLabel, clientSupplierPageSizeOptions, resolveClientSupplierManagementError } from "src/lib/helpers/third-party/third-party-management";
import { getClientSupplierSortValue, resolveClientSupplierAddButtonLabel, resolveClientSupplierListErrorFallback, resolveClientSupplierSearchPlaceholder, resolveClientSupplierSortSelection } from "src/lib/helpers/third-party/third-party-ui";
import type { ClientSupplierTableProps } from "src/types/third-party/third-party-resource";

export function ClientSupplierTable({
  data,
  isLoading,
  error,
  query,
  searchValue,
  type,
  onAdd,
  onSelectRecord,
  onDeleteRecord,
  onSearchChange,
  onClearFilters,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onRetry,
}: ClientSupplierTableProps) {
  const records = data?.items || [];
  const currentPage = data?.page || query.page || 1;
  const totalPages = data?.totalPages || 1;
  const hasActiveFilters = Boolean(query.search) && searchValue === (query.search || "") && !isLoading;
  const columns = createClientSupplierTableColumns({ type, onSelectRecord, onDeleteRecord });
  const pageLabel = buildClientSupplierPageLabel(
    data || { items: [], total: 0, page: query.page, pageSize: query.pageSize, totalPages: 1 },
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <DataTableFilterBar className="xl:flex-row xl:items-end xl:justify-between">
          <DataTableSearchFilter
            id="client-supplier-search"
            label="Buscar"
            value={searchValue}
            placeholder={resolveClientSupplierSearchPlaceholder(type)}
            onChange={onSearchChange}
          />
          <div className="flex flex-wrap items-center justify-end gap-2 xl:max-w-[40%]">
            <DataTableClearFiltersButton isVisible={hasActiveFilters} onClear={onClearFilters} />
          </div>
        </DataTableFilterBar>
      </div>
      <div className="overflow-hidden rounded-[12px] border border-border bg-card">
        <DataTableToolbar
          summary={<span>{data?.total ?? 0} registros encontrados</span>}
          actions={
            <>
              <label className="text-sm text-muted-foreground" htmlFor="client-supplier-sort">
                Ordenar por
              </label>
              <select
                id="client-supplier-sort"
                className="flex h-9 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5C00]"
                value={getClientSupplierSortValue(query.sortBy, query.sortOrder)}
                onChange={(event) => {
                  const { sortBy, sortOrder } = resolveClientSupplierSortSelection(event.target.value);
                  onSortChange(sortBy, sortOrder);
                }}
              >
                <option value="name:asc">Nombre (A-Z)</option>
                <option value="name:desc">Nombre (Z-A)</option>
                <option value="cuit:asc">CUIT (ascendente)</option>
                <option value="cuit:desc">CUIT (descendente)</option>
              </select>
              <Button
                onClick={onAdd}
                className="h-9 bg-[#FF5C00] px-3 text-[#FFFFFF] hover:bg-[#FF8A4C]"
              >
                {resolveClientSupplierAddButtonLabel(type)}
              </Button>
            </>
          }
        />
        <DataTable
          data={records}
          columns={columns}
          getRowId={(record) => record.id}
          isLoading={isLoading}
          loadingState={<DataTableState variant="loading" message={dataTableStateMessages.loading} />}
          errorState={error ? <DataTableState variant="error" message={resolveClientSupplierManagementError(error, resolveClientSupplierListErrorFallback(type))} onAction={onRetry} /> : null}
          emptyState={<DataTableState variant="empty" message={dataTableStateMessages.empty} />}
          className="rounded-none border-0"
          footer={
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={query.pageSize}
              pageLabel={pageLabel}
              pageSizeOptions={clientSupplierPageSizeOptions}
              pageSizeAriaLabel="Mostrar registros por página"
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          }
        />
      </div>
    </div>
  );
}
