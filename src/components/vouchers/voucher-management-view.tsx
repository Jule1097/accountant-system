"use client";

import { Suspense, use } from "react";
import { VoucherDetailModal } from "src/components/vouchers/voucher-detail-modal";
import { VoucherDeleteDialog } from "src/components/vouchers/voucher-delete-dialog";
import { VoucherModal } from "src/components/vouchers/voucher-modal";
import { VoucherSkeleton } from "src/components/vouchers/voucher-skeleton";
import { VoucherTable } from "src/components/vouchers/voucher-table";
import { useVoucherManagement } from "src/hooks/use-voucher-management";
import { Voucher } from "src/models/Voucher";
import { VoucherScreenType } from "src/types/voucher";
import { SalesKpiCards } from "src/components/vouchers/sales-kpi-cards";
import { PurchasesKpiCards } from "src/components/vouchers/purchases-kpi-cards";

interface VoucherManagementViewProps {
  type: VoucherScreenType;
  title: string;
  description: string;
}

interface VoucherTableContainerProps {
  promise: Promise<Voucher[]> | null;
  type: VoucherScreenType;
  onAdd: () => void;
  onSelectVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (voucher: Voucher) => void;
}

function VoucherTableContainer({
  promise,
  type,
  onAdd,
  onSelectVoucher,
  onDeleteVoucher,
}: VoucherTableContainerProps) {
  if (!promise) {
    return null;
  }

  const vouchers = use(promise);

  return (
    <VoucherTable
      data={vouchers}
      type={type}
      onAdd={onAdd}
      onSelectVoucher={onSelectVoucher}
      onDeleteVoucher={onDeleteVoucher}
    />
  );
}

export function VoucherManagementView({ type, title, description }: VoucherManagementViewProps) {
  const {
    isCreateModalOpen,
    isDeleting,
    voucherId,
    voucherPendingDelete,
    vouchersPromise,
    voucherDetailPromise,
    openCreateModal,
    handleCreateModalOpenChange,
    handleEditModalOpenChange,
    handleSelectVoucher,
    handleCreateSuccess,
    handleEditSuccess,
    handleDeleteVoucher,
    handleDeleteDialogOpenChange,
    handleVoucherDetailError,
    confirmVoucherDelete,
  } = useVoucherManagement(type);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
          <div className="h-[104px] rounded-xl bg-card animate-pulse border border-border/50" />
        </div>
      }>
        {type === "sales" ? (
          <SalesKpiCards promise={vouchersPromise} />
        ) : (
          <PurchasesKpiCards promise={vouchersPromise} />
        )}
      </Suspense>

      <Suspense fallback={<VoucherSkeleton />}>
        <VoucherTableContainer
          promise={vouchersPromise}
          type={type}
          onAdd={openCreateModal}
          onSelectVoucher={handleSelectVoucher}
          onDeleteVoucher={handleDeleteVoucher}
        />
      </Suspense>

      <VoucherModal
        isOpen={isCreateModalOpen}
        onOpenChange={handleCreateModalOpenChange}
        type={type}
        mode="create"
        onSuccess={handleCreateSuccess}
      />

      <VoucherDetailModal
        voucherId={voucherId}
        promise={voucherDetailPromise}
        type={type}
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
