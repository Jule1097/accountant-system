"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useToastManager } from "src/components/ui/toast";
import { useVoucherById, useVouchers, useVoucherSummary } from "src/hooks/voucher/use-vouchers";
import { buildEffectiveVoucherQuery, buildVoucherMutationQuery, buildVoucherQuery, moveVoucherPageBack, readVoucherListQuery, resetVoucherPage, resolveVoucherManagementError, resolveVoucherRecordType } from "src/lib/helpers/voucher/voucher-management";
import { revalidateCompanyScope } from "src/lib/helpers/platform/swr";
import { replaceUrlState } from "src/lib/helpers/platform/history-navigation";
import { apiRequest } from "src/lib/api/api-client";
import { useCompany } from "src/contexts/company-context";
import { Voucher } from "src/models/Voucher";
import { UseVoucherManagementResult, VoucherListQueryState, VoucherModalMode, VoucherScreenType } from "src/types/voucher/voucher";

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
  const [viewVoucherState, setViewVoucherState] = useState<{ id: string | null; companyId: string | null }>({
    id: null,
    companyId: null,
  });
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toastManager = useToastManager();
  const { activeCompanyId } = useCompany();
  const currentQueryString = useMemo(() => searchParams.toString(), [searchParams]);
  const query = useMemo(() => readVoucherListQuery(searchParams), [searchParams]);
  const [companyScopeId, setCompanyScopeId] = useState(activeCompanyId);
  const isCompanyChanging = companyScopeId !== activeCompanyId;
  const activeQuery = isCompanyChanging ? emptyQueryState : query;
  const emptyQueryString = useMemo(() => buildVoucherQuery(new URLSearchParams(), emptyQueryState), []);
  const [searchValue, setSearchValue] = useState(query.search || "");
  const [prevSearch, setPrevSearch] = useState(query.search || "");
  const viewVoucherId = viewVoucherState.companyId === activeCompanyId ? viewVoucherState.id : null;

  const currentSearch = activeQuery.search || "";
  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setSearchValue(currentSearch);
  }

  const effectiveQuery = useMemo(
    () => buildEffectiveVoucherQuery(activeQuery, activeQuery.search || undefined),
    [activeQuery]
  );
  const listQuery = useMemo(
    () => ({
      ...effectiveQuery,
      voucherId: null,
    }),
    [effectiveQuery]
  );
  const voucherRecordType = resolveVoucherRecordType(type);
  const { data: vouchersData, isLoading: isTableLoading, mutate: mutateVouchers } = useVouchers(voucherRecordType, listQuery);
  const { data: summaryData, isLoading: isSummaryLoading, mutate: mutateSummary } = useVoucherSummary(voucherRecordType, listQuery);

  const {
    data: dbVoucherDetail,
    error: voucherDetailError,
    isLoading: isDbVoucherDetailLoading,
    mutate: mutateVoucherDetail,
  } = useVoucherById(activeQuery.voucherId || "");

  const selectedVoucherFromList = useMemo(() => {
    if (!viewVoucherId || !vouchersData?.items) {
      return undefined;
    }
    return vouchersData.items.find((item) => item.voucher.id === viewVoucherId)?.voucher;
  }, [viewVoucherId, vouchersData]);

  const voucherDetail = activeQuery.voucherId ? dbVoucherDetail : selectedVoucherFromList;
  const isVoucherDetailLoading = activeQuery.voucherId ? isDbVoucherDetailLoading : false;

  const replaceQuery = useCallback((nextQuery: VoucherListQueryState): void => {
    const nextUrl = `${pathname}${buildVoucherQuery(new URLSearchParams(currentQueryString), nextQuery)}`;
    replaceUrlState(nextUrl);
  }, [currentQueryString, pathname]);

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

  const syncCompanyScopeId = useCallback((nextCompanyId: string | null): void => {
    setCompanyScopeId(nextCompanyId);
  }, []);

  const setViewVoucherId = useCallback((id: string | null): void => {
    setViewVoucherState({
      id,
      companyId: activeCompanyId,
    });
  }, [activeCompanyId]);

  useEffect(() => {
    if (isCompanyChanging) {
      return;
    }

    if (searchValue === (activeQuery.search || "")) {
      return;
    }

    const timeoutId = setTimeout(() => {
      replaceQuery(
        resetVoucherPage(
          buildVoucherMutationQuery(activeQuery, {
            search: searchValue || undefined,
          })
        )
      );
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [activeQuery, isCompanyChanging, replaceQuery, searchValue]);

  useEffect(() => {
    if (!isCompanyChanging) {
      return;
    }

    if (emptyQueryString !== `?${currentQueryString}` && currentQueryString !== "") {
      replaceQuery(emptyQueryState);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      syncCompanyScopeId(activeCompanyId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeCompanyId, currentQueryString, emptyQueryString, isCompanyChanging, replaceQuery, syncCompanyScopeId]);

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

    replaceQuery(buildVoucherMutationQuery(activeQuery, { voucherId: null }));
    setViewVoucherId(null);
  };

  const handleSelectVoucher = (voucher: Voucher, action: "view" | "edit" = "view"): void => {
    if (!voucher.id) {
      return;
    }

    if (action === "edit") {
      replaceQuery(buildVoucherMutationQuery(activeQuery, { voucherId: voucher.id }));
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

  const handleVoucherDetailError = useCallback((error: unknown): void => {
    toastManager.add({
      type: "error",
      title: "Comprobante no disponible",
      description: resolveVoucherManagementError(error, "No se pudo cargar el comprobante seleccionado."),
    });
    replaceQuery(buildVoucherMutationQuery(activeQuery, { voucherId: null }));
    setViewVoucherId(null);
  }, [toastManager, replaceQuery, activeQuery, setViewVoucherId]);

  const handleSearchChange = (value: string): void => {
    setSearchValue(value);
  };

  const handleClearFilters = (): void => {
    replaceQuery({
      ...emptyQueryState,
      voucherId: activeQuery.voucherId,
    });
  };

  const handleStatusChange = (value: VoucherListQueryState["status"]): void => {
    replaceQuery(resetVoucherPage(buildVoucherMutationQuery(activeQuery, { status: value })));
  };

  const handleDateRangeChange = (dateFrom: string, dateTo: string): void => {
    replaceQuery(
      resetVoucherPage(
        buildVoucherMutationQuery(activeQuery, {
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
    replaceQuery(buildVoucherMutationQuery(activeQuery, { sortBy, sortOrder }));
  };

  const handlePageChange = (page: number): void => {
    replaceQuery(buildVoucherMutationQuery(activeQuery, { page }));
  };

  const handlePageSizeChange = (pageSize: number): void => {
    replaceQuery({
      ...buildVoucherMutationQuery(activeQuery, { pageSize }),
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

      const shouldMoveBack = activeQuery.page > 1 && vouchersData?.items.length === 1;
      const nextQuery = shouldMoveBack ? moveVoucherPageBack(activeQuery) : activeQuery;
      const normalizedQuery =
        activeQuery.voucherId === voucherPendingDelete.id
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
    query: activeQuery,
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
