"use client";

import { VoucherDeleteDialog } from "src/components/vouchers/voucher-delete-dialog";
import { VoucherDetailModal } from "src/components/vouchers/voucher-detail-modal";
import { VoucherModal } from "src/components/vouchers/voucher-modal";
import { PurchasesKpiCards } from "src/components/vouchers/purchases-kpi-cards";
import { SalesKpiCards } from "src/components/vouchers/sales-kpi-cards";
import { VoucherSkeleton } from "src/components/vouchers/voucher-skeleton";
import { VoucherTable } from "src/components/vouchers/voucher-table";
import { useVoucherManagement } from "src/hooks/use-voucher-management";
import { VoucherScreenType } from "src/types/voucher";

interface VoucherManagementViewProps {
  type: VoucherScreenType;
  title: string;
  description: string;
}

export function VoucherManagementView({ type, title, description }: VoucherManagementViewProps) {
  const {
    isCreateModalOpen,
    isDeleting,
    voucherId,
    viewVoucherId,
    voucherPendingDelete,
    query,
    searchValue,
    isTableLoading,
    isSummaryLoading,
    vouchersData,
    summaryData,
    voucherDetail,
    voucherDetailError,
    isVoucherDetailLoading,
    openCreateModal,
    handleCreateModalOpenChange,
    handleEditModalOpenChange,
    handleSelectVoucher,
    handleCreateSuccess,
    handleEditSuccess,
    handleDeleteVoucher,
    handleDeleteDialogOpenChange,
    handleVoucherDetailError,
    handleSearchChange,
    handleClearFilters,
    handleStatusChange,
    handleDateRangeChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    confirmVoucherDelete,
  } = useVoucherManagement(type);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {isSummaryLoading || !summaryData ? (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
        </div>
      ) : type === "sales" ? (
        <SalesKpiCards summary={summaryData} />
      ) : (
        <PurchasesKpiCards summary={summaryData} />
      )}

      {isTableLoading || !vouchersData ? (
        <VoucherSkeleton />
      ) : (
        <VoucherTable
          data={vouchersData}
          query={query}
          searchValue={searchValue}
          type={type}
          onAdd={openCreateModal}
          onSelectVoucher={handleSelectVoucher}
          onDeleteVoucher={handleDeleteVoucher}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
          onStatusChange={handleStatusChange}
          onDateRangeChange={handleDateRangeChange}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <VoucherModal
        isOpen={isCreateModalOpen}
        onOpenChange={handleCreateModalOpenChange}
        type={type}
        mode="create"
        onSuccess={handleCreateSuccess}
      />

      <VoucherDetailModal
        voucherId={voucherId || viewVoucherId}
        voucher={voucherDetail}
        error={voucherDetailError}
        isLoading={isVoucherDetailLoading}
        type={type}
        mode={voucherId ? "edit" : "view"}
        onOpenChange={handleEditModalOpenChange}
        onSuccess={handleEditSuccess}
        onLoadError={handleVoucherDetailError}
      />

      <VoucherDeleteDialog
        isOpen={Boolean(voucherPendingDelete)}
        voucher={voucherPendingDelete}
        isDeleting={isDeleting}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={confirmVoucherDelete}
      />
    </div>
  );
}
