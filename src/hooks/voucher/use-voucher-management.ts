"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useResourceDeletionCoordinator } from "src/hooks/shared/use-resource-deletion";
import { useResourceMutation } from "src/hooks/shared/use-resource";
import { useTableQueryState } from "src/hooks/shared/use-table-query-state";
import { useToastManager } from "src/components/ui/toast";
import { useVoucherById, useVouchers, useVoucherSummary } from "src/hooks/voucher/use-vouchers";
import { buildEffectiveVoucherQuery, buildVoucherMutationQuery, buildVoucherQuery, moveVoucherPageBack, readVoucherListQuery, resetVoucherPage, resolveVoucherManagementError, resolveVoucherRecordType, voucherSearchDebounceMs, voucherTableParameters } from "src/lib/helpers/voucher/voucher-management";
import { createVoucherMutationAdapter } from "src/lib/helpers/voucher/voucher-resource-adapter";
import { revalidateCompanyScope } from "src/lib/helpers/platform/swr";
import { useCompany } from "src/contexts/company-context";
import { VoucherApiResponse } from "src/types/voucher/voucher-api";
import { UseVoucherManagementResult, VoucherListQueryState, VoucherModalMode, VoucherScreenType } from "src/types/voucher/voucher";

const emptyQueryState: VoucherListQueryState = {
  page: 1,
  pageSize: 10,
  sortBy: "date",
  sortOrder: "desc",
  status: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  voucherId: null,
};

export function useVoucherManagement(type: VoucherScreenType): UseVoucherManagementResult {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [voucherPendingDelete, setVoucherPendingDelete] = useState<VoucherApiResponse | null>(null);
  const [viewVoucherState, setViewVoucherState] = useState<{ id: string | null; companyId: string | null }>({
    id: null,
    companyId: null,
  });
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toastManager = useToastManager();
  const { activeCompanyId } = useCompany();
  const { remove: deleteVoucher, isMutating: isDeleting } = useResourceMutation({ adapter: createVoucherMutationAdapter(), scopeId: activeCompanyId });
  const sourceQuery = useMemo(() => readVoucherListQuery(searchParams), [searchParams]);
  const [companyScopeId, setCompanyScopeId] = useState(activeCompanyId);
  const isCompanyChanging = companyScopeId !== activeCompanyId;
  const activeQuery = isCompanyChanging ? emptyQueryState : sourceQuery;
  const emptyQueryString = useMemo(() => buildVoucherQuery(emptyQueryState), []);
  const viewVoucherId = viewVoucherState.companyId === activeCompanyId ? viewVoucherState.id : null;

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
  const tableQueryState = useTableQueryState({ pathname, parameters: voucherTableParameters, pageKey: "page", searchKey: "search", totalPages: vouchersData?.totalPages, debounceMs: voucherSearchDebounceMs });
  const managementQuery = (isCompanyChanging ? emptyQueryState : tableQueryState.query) as VoucherListQueryState;
  const { searchValue, setSearch } = tableQueryState;

  const {
    data: dbVoucherDetail,
    error: voucherDetailError,
    isLoading: isDbVoucherDetailLoading,
    mutate: mutateVoucherDetail,
  } = useVoucherById(managementQuery.voucherId || "");

  const selectedVoucherFromList = useMemo(() => {
    if (!viewVoucherId || !vouchersData?.items) {
      return undefined;
    }
    return vouchersData.items.find((item) => item.voucher.id === viewVoucherId)?.voucher;
  }, [viewVoucherId, vouchersData]);

  const voucherDetail = managementQuery.voucherId ? dbVoucherDetail : selectedVoucherFromList;
  const isVoucherDetailLoading = managementQuery.voucherId ? isDbVoucherDetailLoading : false;

  const replaceQuery = useCallback((nextQuery: Partial<VoucherListQueryState>): void => tableQueryState.update(nextQuery), [tableQueryState]);

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

  const resolveNextDeleteQuery = useCallback((): VoucherListQueryState => {
    const shouldMoveBack = managementQuery.page > 1 && vouchersData?.items.length === 1;
    const nextQuery = shouldMoveBack ? moveVoucherPageBack(managementQuery) : managementQuery;
    return managementQuery.voucherId === voucherPendingDelete?.id ? buildVoucherMutationQuery(nextQuery, { voucherId: null }) : nextQuery;
  }, [managementQuery, voucherPendingDelete?.id, vouchersData?.items.length]);

  const deletion = useResourceDeletionCoordinator({
    pendingRecord: voucherPendingDelete,
    getResourceId: (voucher) => voucher.id || null,
    deleteResource: deleteVoucher,
    isDeleting,
    resolveNextQuery: resolveNextDeleteQuery,
    updateQuery: replaceQuery,
    clearPendingRecord: () => setVoucherPendingDelete(null),
    refreshList: revalidateVoucherScopes,
  });

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
    if (!isCompanyChanging) {
      return;
    }

    if (emptyQueryString !== `?${searchParams.toString()}` && searchParams.toString() !== "") {
      replaceQuery({ ...emptyQueryState, search: "" });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      syncCompanyScopeId(activeCompanyId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeCompanyId, emptyQueryString, isCompanyChanging, replaceQuery, searchParams, syncCompanyScopeId]);

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

    replaceQuery(buildVoucherMutationQuery(managementQuery, { voucherId: null }));
    setViewVoucherId(null);
  };

  const handleSelectVoucher = (voucher: VoucherApiResponse, action: "view" | "edit" = "view"): void => {
    if (!voucher.id) {
      return;
    }

    if (action === "edit") {
      replaceQuery(buildVoucherMutationQuery(managementQuery, { voucherId: voucher.id }));
    } else {
      setViewVoucherId(voucher.id);
    }
  };

  const handleDeleteVoucher = (voucher: VoucherApiResponse): void => {
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
    replaceQuery(buildVoucherMutationQuery(managementQuery, { voucherId: null }));
    setViewVoucherId(null);
  }, [toastManager, replaceQuery, managementQuery, setViewVoucherId]);

  const handleSearchChange = (value: string): void => {
    setSearch(value);
  };

  const handleClearFilters = (): void => {
    replaceQuery({ ...emptyQueryState, search: "", voucherId: managementQuery.voucherId });
  };

  const handleStatusChange = (value: VoucherListQueryState["status"]): void => {
    replaceQuery(resetVoucherPage(buildVoucherMutationQuery(managementQuery, { status: value })));
  };

  const handleDateRangeChange = (dateFrom: string, dateTo: string): void => {
    replaceQuery(
      resetVoucherPage(
        buildVoucherMutationQuery(managementQuery, {
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
    replaceQuery(buildVoucherMutationQuery(managementQuery, { sortBy, sortOrder }));
  };

  const handlePageChange = (page: number): void => {
    replaceQuery(buildVoucherMutationQuery(managementQuery, { page }));
  };

  const handlePageSizeChange = (pageSize: number): void => {
    replaceQuery({
      ...buildVoucherMutationQuery(managementQuery, { pageSize }),
      page: 1,
    });
  };

  const handleCreateSuccess = async (): Promise<void> => {
    await revalidateVoucherScopes();
  };

  const handleEditSuccess = async (_voucher: VoucherApiResponse, mode: VoucherModalMode): Promise<void> => {
    if (mode !== "edit") {
      return;
    }

    await Promise.all([revalidateVoucherScopes(), mutateVoucherDetail()]);
  };

  const confirmVoucherDelete = async (): Promise<void> => {
    try {
      await deletion.confirmDelete();

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
    }
  };

  return {
    isCreateModalOpen,
    isDeleting,
    voucherId: managementQuery.voucherId || null,
    viewVoucherId,
    setViewVoucherId,
    voucherPendingDelete,
    query: managementQuery,
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
