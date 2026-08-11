"use client";

import { startTransition, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToastManager } from "src/components/ui/toast";
import { useVoucherById, useVouchers } from "src/hooks/use-vouchers";
import { buildVoucherQuery, resolveVoucherManagementError } from "src/lib/helpers/voucher-management";
import { apiRequest } from "src/lib/api-client";
import { Voucher } from "src/models/Voucher";
import { VoucherModalMode, VoucherScreenType } from "src/types/voucher";

interface UseVoucherManagementResult {
  isCreateModalOpen: boolean;
  isDeleting: boolean;
  voucherId: string | null;
  voucherPendingDelete: Voucher | null;
  vouchersPromise: Promise<Voucher[]> | null;
  voucherDetailPromise: Promise<Voucher> | null;
  openCreateModal: () => void;
  handleCreateModalOpenChange: (open: boolean) => void;
  handleEditModalOpenChange: (open: boolean) => void;
  handleSelectVoucher: (voucher: Voucher) => void;
  handleCreateSuccess: () => void;
  handleEditSuccess: (_voucher: Voucher, mode: VoucherModalMode) => void;
  handleDeleteVoucher: (voucher: Voucher) => void;
  handleDeleteDialogOpenChange: (open: boolean) => void;
  handleVoucherDetailError: (error: unknown) => void;
  confirmVoucherDelete: () => Promise<void>;
}

function resolveVoucherApiType(type: VoucherScreenType): "sale" | "purchase" {
  if (type === "sales") {
    return "sale";
  }

  return "purchase";
}

export function useVoucherManagement(type: VoucherScreenType): UseVoucherManagementResult {
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [voucherPendingDelete, setVoucherPendingDelete] = useState<Voucher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toastManager = useToastManager();
  const voucherId = searchParams.get("voucherId");
  const currentQueryString = useMemo(() => searchParams.toString(), [searchParams]);
  const { promise: vouchersPromise } = useVouchers(resolveVoucherApiType(type), reloadKey);
  const { promise: voucherDetailPromise } = useVoucherById(voucherId || "");

  const updateVoucherQuery = (nextVoucherId: string | null): void => {
    const nextQuery = buildVoucherQuery(new URLSearchParams(currentQueryString), nextVoucherId);

    startTransition(() => {
      router.replace(`${pathname}${nextQuery}`, { scroll: false });
    });
  };

  const refreshVouchers = (): void => {
    setReloadKey((currentValue) => currentValue + 1);
  };

  const openCreateModal = (): void => {
    setIsCreateModalOpen(true);
  };

  const handleCreateModalOpenChange = (open: boolean): void => {
    setIsCreateModalOpen(open);
  };

  const handleEditModalOpenChange = (open: boolean): void => {
    if (open) {
      return;
    }

    updateVoucherQuery(null);
  };

  const handleSelectVoucher = (voucher: Voucher): void => {
    if (!voucher.id) {
      return;
    }

    updateVoucherQuery(voucher.id);
  };

  const handleCreateSuccess = (): void => {
    refreshVouchers();
  };

  const handleEditSuccess = (_voucher: Voucher, mode: VoucherModalMode): void => {
    if (mode !== "edit") {
      return;
    }

    refreshVouchers();
  };

  const handleDeleteVoucher = (voucher: Voucher): void => {
    setVoucherPendingDelete(voucher);
  };

  const handleDeleteDialogOpenChange = (open: boolean): void => {
    if (open) {
      return;
    }

    setVoucherPendingDelete(null);
  };

  const handleVoucherDetailError = (error: unknown): void => {
    toastManager.add({
      type: "error",
      title: "Comprobante no disponible",
      description: resolveVoucherManagementError(error, "No se pudo cargar el comprobante seleccionado."),
    });
    updateVoucherQuery(null);
  };

  const confirmVoucherDelete = async (): Promise<void> => {
    if (!voucherPendingDelete?.id) {
      return;
    }

    setIsDeleting(true);

    try {
      await apiRequest(`/api/vouchers/${voucherPendingDelete.id}`, {
        method: "DELETE",
      });

      toastManager.add({
        type: "success",
        title: "Comprobante eliminado",
        description: "El comprobante se eliminó correctamente.",
      });

      if (voucherId === voucherPendingDelete.id) {
        updateVoucherQuery(null);
      }

      setVoucherPendingDelete(null);
      refreshVouchers();
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: "No se pudo eliminar",
        description: resolveVoucherManagementError(error, "No se pudo eliminar el comprobante."),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
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
  };
}
