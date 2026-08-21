"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToastManager } from "src/components/ui/toast";
import { useVoucherById, useVouchers, useVoucherSummary } from "src/hooks/use-vouchers";
import { buildEffectiveVoucherQuery, buildVoucherMutationQuery, buildVoucherQuery, moveVoucherPageBack, readVoucherListQuery, resetVoucherPage, resolveVoucherManagementError, resolveVoucherRecordType } from "src/lib/helpers/voucher-management";
import { revalidateCompanyScope } from "src/lib/helpers/swr";
import { apiRequest } from "src/lib/api-client";
import { useCompany } from "src/contexts/company-context";
import { Voucher } from "src/models/Voucher";
import { UseVoucherManagementResult, VoucherListQueryState, VoucherModalMode, VoucherScreenType } from "src/types/voucher";

const emptyQueryState: VoucherListQueryState = {
  page: 1,
  pageSize: 10,
  sortBy: "date",
  sortOrder: "desc",
  voucherId: null,
};

export function useVoucherManagement(type: VoucherScreenType): UseVoucherManagementResult {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [voucherPendingDelete, setVoucherPendingDelete] = useState<Voucher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toastManager = useToastManager();
  const { activeCompanyId } = useCompany();
  const previousCompanyIdRef = useRef<string | null>(activeCompanyId);
  const currentQueryString = useMemo(() => searchParams.toString(), [searchParams]);
  const query = useMemo(() => readVoucherListQuery(searchParams), [searchParams]);
  const [searchValue, setSearchValue] = useState(query.search || "");
  const [prevSearch, setPrevSearch] = useState(query.search || "");
  const [viewVoucherId, setViewVoucherId] = useState<string | null>(null);

  const currentSearch = query.search || "";
  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setSearchValue(currentSearch);
  }

  const effectiveQuery = useMemo(
    () => buildEffectiveVoucherQuery(query, query.search || undefined),
    [query]
  );
  const voucherRecordType = resolveVoucherRecordType(type);
  const { data: vouchersData, isLoading: isTableLoading, mutate: mutateVouchers } = useVouchers(voucherRecordType, effectiveQuery);
  const { data: summaryData, isLoading: isSummaryLoading, mutate: mutateSummary } = useVoucherSummary(voucherRecordType, effectiveQuery);
  
  const {
    data: dbVoucherDetail,
    error: voucherDetailError,
    isLoading: isDbVoucherDetailLoading,
    mutate: mutateVoucherDetail,
  } = useVoucherById(query.voucherId || "");

  const selectedVoucherFromList = useMemo(() => {
    if (!viewVoucherId || !vouchersData?.items) {
      return undefined;
    }
    return vouchersData.items.find((item) => item.voucher.id === viewVoucherId)?.voucher;
  }, [viewVoucherId, vouchersData]);

  const voucherDetail = query.voucherId ? dbVoucherDetail : selectedVoucherFromList;
  const isVoucherDetailLoading = query.voucherId ? isDbVoucherDetailLoading : false;

  const replaceQuery = useCallback((nextQuery: VoucherListQueryState): void => {
    const nextUrl = `${pathname}${buildVoucherQuery(new URLSearchParams(currentQueryString), nextQuery)}`;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }, [currentQueryString, pathname, router]);

  const revalidateVoucherScopes = async (): Promise<void> => {
    if (!activeCompanyId) {
      return;
    }

    await Promise.all([
      mutateVouchers(),
      mutateSummary(),
      revalidateCompanyScope(activeCompanyId, ['/api/analytics']),
    ]);
  };

  // Debounce search input and update URL query
  useEffect(() => {
    if (searchValue === (query.search || "")) {
      return;
    }

    const timeoutId = setTimeout(() => {
      replaceQuery(
        resetVoucherPage(
          buildVoucherMutationQuery(query, {
            search: searchValue || undefined,
          })
        )
      );
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [searchValue, query, replaceQuery]);

  useEffect(() => {
    if (previousCompanyIdRef.current === activeCompanyId) {
      return;
    }

    previousCompanyIdRef.current = activeCompanyId;
    setViewVoucherId(null);
    replaceQuery(emptyQueryState);
  }, [activeCompanyId, replaceQuery]);

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

    replaceQuery(buildVoucherMutationQuery(query, { voucherId: null }));
    setViewVoucherId(null);
  };

  const handleSelectVoucher = (voucher: Voucher, action: "view" | "edit" = "view"): void => {
    if (!voucher.id) {
      return;
    }

    if (action === "edit") {
      replaceQuery(buildVoucherMutationQuery(query, { voucherId: voucher.id }));
    } else {
      setViewVoucherId(voucher.id);
    }
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
    replaceQuery(buildVoucherMutationQuery(query, { voucherId: null }));
    setViewVoucherId(null);
  };

  const handleSearchChange = (value: string): void => {
    setSearchValue(value);
  };

  const handleClearFilters = (): void => {
    replaceQuery({
      ...emptyQueryState,
      voucherId: query.voucherId,
    });
  };

  const handleStatusChange = (value: VoucherListQueryState["status"]): void => {
    replaceQuery(resetVoucherPage(buildVoucherMutationQuery(query, { status: value })));
  };

  const handleDateRangeChange = (dateFrom: string, dateTo: string): void => {
    replaceQuery(
      resetVoucherPage(
        buildVoucherMutationQuery(query, {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
      )
    );
  };

  const handleSortChange = (
    sortBy: VoucherListQueryState["sortBy"],
    sortOrder: VoucherListQueryState["sortOrder"]
  ): void => {
    replaceQuery(buildVoucherMutationQuery(query, { sortBy, sortOrder }));
  };

  const handlePageChange = (page: number): void => {
    replaceQuery(buildVoucherMutationQuery(query, { page }));
  };

  const handlePageSizeChange = (pageSize: number): void => {
    replaceQuery({
      ...buildVoucherMutationQuery(query, { pageSize }),
      page: 1,
    });
  };

  const handleCreateSuccess = async (): Promise<void> => {
    await revalidateVoucherScopes();
  };

  const handleEditSuccess = async (_voucher: Voucher, mode: VoucherModalMode): Promise<void> => {
    if (mode !== "edit") {
      return;
    }

    await Promise.all([revalidateVoucherScopes(), mutateVoucherDetail()]);
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

      const shouldMoveBack = query.page > 1 && vouchersData?.items.length === 1;
      const nextQuery = shouldMoveBack ? moveVoucherPageBack(query) : query;
      const normalizedQuery =
        query.voucherId === voucherPendingDelete.id
          ? buildVoucherMutationQuery(nextQuery, { voucherId: null })
          : nextQuery;

      replaceQuery(normalizedQuery);
      setVoucherPendingDelete(null);
      await revalidateVoucherScopes();

      toastManager.add({
        type: "success",
        title: "Comprobante eliminado",
        description: "El comprobante se eliminó correctamente.",
      });
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
    voucherId: query.voucherId || null,
    viewVoucherId,
    setViewVoucherId,
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
  };
}
