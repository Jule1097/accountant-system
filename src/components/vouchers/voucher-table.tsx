"use client";

import { DataTable } from "src/components/ui/data-table";
import { PaginationControls } from "src/components/ui/pagination-controls";
import { VoucherTableFilters } from "src/components/vouchers/voucher-table-filters";
import { createVoucherTableColumns } from "src/components/vouchers/voucher-table-columns";
import { VoucherTableToolbar } from "src/components/vouchers/voucher-table-toolbar";
import { buildVoucherPageLabel, voucherPageSizeOptions } from "src/lib/helpers/voucher/voucher-management";
import type { VoucherApiResponse } from "src/types/voucher/voucher-api";
import type { VoucherListQueryState, VoucherListResponse, VoucherScreenType, VoucherSortBy, VoucherSortOrder, VoucherStatus } from "src/types/voucher/voucher";

interface VoucherTableProps {
  data?: VoucherListResponse;
  query: VoucherListQueryState;
  searchValue: string;
  type: VoucherScreenType;
  onAdd: () => void;
  onSelectVoucher: (voucher: VoucherApiResponse, action?: "view" | "edit") => void;
  onDeleteVoucher: (voucher: VoucherApiResponse) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onStatusChange: (value: VoucherStatus | undefined) => void;
  onDateRangeChange: (dateFrom: string, dateTo: string) => void;
  onSortChange: (sortBy: VoucherSortBy | undefined, sortOrder: VoucherSortOrder | undefined) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function VoucherTable({
  data,
  query,
  searchValue,
  type,
  onAdd,
  onSelectVoucher,
  onDeleteVoucher,
  onSearchChange,
  onClearFilters,
  onStatusChange,
  onDateRangeChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: VoucherTableProps) {
  const rows = data?.items || [];
  const currentPage = data?.page || query.page || 1;
  const totalPages = data?.totalPages || 1;
  const columns = createVoucherTableColumns({ type, onSelectVoucher, onDeleteVoucher });
  const pageLabel = buildVoucherPageLabel(
    data || { items: [], total: 0, page: query.page, pageSize: query.pageSize, totalPages: 1 },
  );

  return (
    <div className="space-y-4">
      <VoucherTableFilters
        query={query}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
        onStatusChange={onStatusChange}
        onDateRangeChange={onDateRangeChange}
      />
      <div className="overflow-hidden rounded-[12px] border border-border bg-card">
        <VoucherTableToolbar
          total={data?.total ?? 0}
          query={query}
          type={type}
          onAdd={onAdd}
          onSortChange={onSortChange}
        />
        <DataTable
          data={rows}
          columns={columns}
          getRowId={(row) => row.rowKey}
          emptyState="No se encontraron comprobantes."
          className="rounded-none border-0"
          footer={
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={query.pageSize}
              pageLabel={pageLabel}
              pageSizeOptions={voucherPageSizeOptions}
              pageSizeAriaLabel="Mostrar comprobantes por página"
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          }
        />
      </div>
    </div>
  );
}
