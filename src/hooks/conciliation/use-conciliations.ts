"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useCompany } from "src/contexts/company-context";
import { apiRequest } from "src/lib/api/api-client";
import {
  areAllVisibleDiscardableSelected,
  buildConciliationSectionSelectionState,
  buildConciliationsPath,
  buildConciliationsQueryString,
  readConciliationsQuery,
  resolveActionErrorMessage,
  resolveConciliationsRefreshInterval,
  resolveSelectedVisibleItemIds,
} from "src/lib/helpers/conciliation/conciliations-state";
import { buildCompanyPathKey, companyPathFetcher } from "src/lib/helpers/platform/swr";
import { useToastManager } from "src/components/ui/toast";
import { conciliationTableParameters } from "src/lib/helpers/conciliation/conciliations-state";
import { useAccumulatedSelection } from "src/hooks/shared/use-accumulated-selection";
import { useTableQueryState } from "src/hooks/shared/use-table-query-state";
import {
  ConciliationBulkDiscardResponse,
  ConciliationBulkPersistResponse,
  ConciliationDeleteDialogState,
  ConciliationItem,
  ConciliationItemAction,
  ConciliationPersistBatchActionState,
  ConciliationPersistResult,
  ConciliationSectionData,
  ConciliationSectionSelectionState,
  ConciliationsPageData,
  ConciliationsQueryState,
  ConciliationTab,
} from "src/types/conciliation/conciliations";
import { ParserBatchItemContextRecord } from "src/types/parser/parser-batch";
import { VoucherFormPayload } from "src/types/voucher/voucher-form";

function flattenSectionItems(sections: ConciliationSectionData[]): ConciliationItem[] {
  return sections.flatMap((section) => section.items);
}

function getValidatedVisibleItems(items: ConciliationItem[], selectedItemIds: string[]): ConciliationItem[] {
  return items.filter((item) => item.status === "Validada" && selectedItemIds.includes(item.id));
}

function getValidatedVisibleItemIds(items: ConciliationItem[], selectedItemIds: string[]): string[] {
  return getValidatedVisibleItems(items, selectedItemIds).map((item) => item.id);
}

export function useConciliations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toastManager = useToastManager();
  const { activeCompanyId, loading: isCompanyLoading } = useCompany();
  const selection = useAccumulatedSelection<string>({ companyId: activeCompanyId });
  const { selectedIds: selectedItemIds } = selection;
  const [loadingVouchers, setLoadingVouchers] = useState<Record<string, ConciliationItemAction | undefined>>({});
  const [reviewItemId, setReviewItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ConciliationItem | null>(null);
  const [pendingBulkDeleteItemIds, setPendingBulkDeleteItemIds] = useState<string[]>([]);
  const [deleteDialogMode, setDeleteDialogMode] = useState<"single" | "bulk" | null>(null);
  const handledNotificationIdRef = useRef<string | null>(null);
  const handledStaleBatchPathRef = useRef<string | null>(null);
  const sourceQuery = useMemo(() => readConciliationsQuery(searchParams), [searchParams]);
  const path = buildConciliationsPath(sourceQuery);
  const key = buildCompanyPathKey(activeCompanyId, path, !isCompanyLoading);
  const { data, mutate, isLoading } = useSWR<ConciliationsPageData>(
    key,
    ([companyId, requestPath]: readonly [string, string]) =>
      companyPathFetcher<ConciliationsPageData>(companyId, requestPath),
    {
      refreshInterval: (currentData: ConciliationsPageData | undefined) =>
        resolveConciliationsRefreshInterval(currentData),
      revalidateOnFocus: false,
      refreshWhenHidden: false,
    }
  );
  const tableQueryState = useTableQueryState({ pathname, parameters: conciliationTableParameters, pageKey: "page", totalPages: data?.totalPages });
  const query = tableQueryState.query;
  const notificationId = query.notificationId;
  const reviewItemKey = buildCompanyPathKey(
    activeCompanyId,
    reviewItemId ? `/api/vouchers/parse/items/${reviewItemId}` : null,
    !isCompanyLoading
  );
  const { data: reviewItem, isLoading: isReviewItemLoading } = useSWR(
    reviewItemKey,
    ([companyId, requestPath]: readonly [string, string]) =>
      companyPathFetcher<ParserBatchItemContextRecord>(companyId, requestPath),
    {
      revalidateOnFocus: false,
    }
  );
  const sections = useMemo(() => data?.sections || [], [data?.sections]);
  const visibleItems = useMemo(() => flattenSectionItems(sections), [sections]);
  const removableItemIds = useMemo(() => {
    return visibleItems.filter((item) => item.canDiscard).map((item) => item.id);
  }, [visibleItems]);
  const selectedVisibleItemIds = useMemo(() => {
    return resolveSelectedVisibleItemIds(removableItemIds, selectedItemIds);
  }, [removableItemIds, selectedItemIds]);
  const allVisibleDiscardableSelected = areAllVisibleDiscardableSelected(removableItemIds, selectedItemIds);
  const selectedValidatedItemIds = useMemo(() => {
    return getValidatedVisibleItemIds(visibleItems, selectedItemIds);
  }, [selectedItemIds, visibleItems]);
  const persistBatchAction = useMemo<ConciliationPersistBatchActionState>(() => {
    return {
      itemIds: selectedValidatedItemIds,
      selectedValidatedCount: selectedValidatedItemIds.length,
      canPersist: selectedValidatedItemIds.length > 0,
    };
  }, [selectedValidatedItemIds]);
  const deleteDialogState = useMemo<ConciliationDeleteDialogState>(() => {
    if (deleteDialogMode === "single" && pendingDeleteItem) {
      return {
        isOpen: true,
        title: "Eliminar factura",
        description: `Vas a eliminar la factura ${pendingDeleteItem.documentId} de conciliaciones. Esta acción no se puede deshacer.`,
        mode: "single",
      };
    }

    if (deleteDialogMode === "bulk" && pendingBulkDeleteItemIds.length > 0) {
      return {
        isOpen: true,
        title: "Eliminar facturas",
        description: `Vas a eliminar ${pendingBulkDeleteItemIds.length} facturas de conciliaciones. Esta acción no se puede deshacer.`,
        mode: "bulk",
      };
    }

    return {
      isOpen: false,
      title: "Eliminar factura",
      description: "Esta acción no se puede deshacer.",
      mode: null,
    };
  }, [deleteDialogMode, pendingBulkDeleteItemIds.length, pendingDeleteItem]);

  useEffect(() => {
    if (!data || !query.batchId || data.totalCount > 0) {
      return;
    }

    const staleBatchPath = `${query.batchId}:${query.tab}:${query.page}`;

    if (handledStaleBatchPathRef.current === staleBatchPath) {
      return;
    }

    handledStaleBatchPathRef.current = staleBatchPath;
    void (async () => {
      if (notificationId) {
        await apiRequest(`/api/notifications/${notificationId}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }

      toastManager.add({
        type: "success",
        title: "Carga resuelta",
        description: "Las facturas de esta carga ya no requieren revisión.",
      });
      router.replace(`${pathname}?${buildConciliationsQueryString({ tab: query.tab, page: 1 })}`, { scroll: false });
    })();
  }, [data, notificationId, pathname, query, router, toastManager]);

  useEffect(() => {
    if (!notificationId || !data || (query.batchId && data.totalCount === 0)) {
      return;
    }

    if (handledNotificationIdRef.current === notificationId) {
      return;
    }

    handledNotificationIdRef.current = notificationId;
    void apiRequest(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    }).then(() => {
      router.replace(`${pathname}?${buildConciliationsQueryString(query)}`, { scroll: false });
    }).catch(() => undefined);
  }, [data, notificationId, pathname, query, router]);

  const isPageLoading = isCompanyLoading || (isLoading && !data);

  function syncQuery(nextQuery: ConciliationsQueryState): void {
    tableQueryState.update(nextQuery);
  }

  function updateLoadingState(itemId: string, action: ConciliationItemAction | null): void {
    setLoadingVouchers((currentValue) => ({
      ...currentValue,
      [itemId]: action || undefined,
    }));
  }

  async function revalidateConciliations(): Promise<void> {
    await mutate();
  }

  function handleTabChange(tab: ConciliationTab) {
    selection.clear();
    syncQuery({
      ...query,
      tab,
      page: 1,
    });
  }

  function handlePageChange(page: number) {
    syncQuery({
      ...query,
      page,
    });
  }

  function handleToggleItemSelection(item: ConciliationItem, checked: boolean): void {
    if (!item.canDiscard) {
      return;
    }

    selection.toggle(item.id, checked);
  }

  function handleToggleAllDiscardable(checked: boolean): void {
    if (!checked) {
      selection.toggleMany(removableItemIds, false);
      return;
    }

    selection.toggleMany(removableItemIds, true);
  }

  function handleToggleVisibleSelection(itemIds: string[], checked: boolean): void {
    if (!checked) {
      selection.toggleMany(itemIds, false);
      return;
    }

    selection.toggleMany(itemIds, true);
  }

  function handleReview(item: ConciliationItem) {
    setReviewItemId(item.id);
  }

  function handleReviewModalOpenChange(open: boolean): void {
    if (open) {
      return;
    }

    setReviewItemId(null);
  }

  function handleDeleteDialogOpenChange(open: boolean): void {
    if (open) {
      return;
    }

    setDeleteDialogMode(null);
    setPendingDeleteItem(null);
    setPendingBulkDeleteItemIds([]);
  }

  async function handleReviewSubmit(payload: VoucherFormPayload): Promise<void> {
    if (!reviewItemId) {
      return;
    }

    updateLoadingState(reviewItemId, "reviewing");

    try {
      await apiRequest(`/api/conciliations/items/${reviewItemId}/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      await revalidateConciliations();
      router.refresh();
      setReviewItemId(null);
      toastManager.add({
        type: "success",
        title: "Factura validada",
        description: "La factura quedó validada para confirmar su persistencia.",
      });
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: "No se pudo validar",
        description: resolveActionErrorMessage(error, "No se pudo validar la factura."),
      });
    } finally {
      updateLoadingState(reviewItemId, null);
    }
  }

  async function handleRegenerate(item: ConciliationItem): Promise<void> {
    updateLoadingState(item.id, "retrying");

    try {
      await apiRequest(`/api/vouchers/parse/items/${item.id}/retry`, {
        method: "POST",
      });
      await revalidateConciliations();
      toastManager.add({
        type: "success",
        title: "Reprocesamiento iniciado",
        description: `La factura ${item.documentId} volvió a procesarse.`,
      });
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: "No se pudo reprocesar",
        description: resolveActionErrorMessage(error, "No se pudo reprocesar la factura."),
      });
    } finally {
      updateLoadingState(item.id, null);
    }
  }

  async function handleDelete(item: ConciliationItem): Promise<void> {
    setPendingDeleteItem(item);
    setDeleteDialogMode("single");
  }

  async function confirmDelete(): Promise<void> {
    if (!pendingDeleteItem) {
      return;
    }

    updateLoadingState(pendingDeleteItem.id, "deleting");
    setIsDeleting(true);

    try {
      await apiRequest(`/api/conciliations/items/${pendingDeleteItem.id}/discard`, {
        method: "POST",
      });
      await revalidateConciliations();
      router.refresh();
      selection.toggle(pendingDeleteItem.id, false);
      setDeleteDialogMode(null);
      setPendingDeleteItem(null);
      toastManager.add({
        type: "success",
        title: "Factura descartada",
        description: "La factura se quitó de conciliaciones.",
      });
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: "No se pudo descartar",
        description: resolveActionErrorMessage(error, "No se pudo descartar la factura."),
      });
    } finally {
      updateLoadingState(pendingDeleteItem.id, null);
      setIsDeleting(false);
    }
  }

  async function handleDeleteSelected(itemIds?: string[]): Promise<void> {
    const nextItemIds = itemIds && itemIds.length > 0 ? itemIds : selectedVisibleItemIds;

    if (nextItemIds.length === 0) {
      return;
    }

    setPendingBulkDeleteItemIds(nextItemIds);
    setDeleteDialogMode("bulk");
  }

  async function confirmDeleteSelected(): Promise<void> {
    if (pendingBulkDeleteItemIds.length === 0) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await apiRequest("/api/conciliations/items/discard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemIds: pendingBulkDeleteItemIds,
        }),
      });
      const payload = await response.json() as ConciliationBulkDiscardResponse;
      await revalidateConciliations();
      router.refresh();
      setDeleteDialogMode(null);
      selection.toggleMany(pendingBulkDeleteItemIds, false);
      setPendingBulkDeleteItemIds([]);
      toastManager.add({
        type: "success",
        title: "Facturas descartadas",
        description: `Se quitaron ${payload.removedItems} facturas de conciliaciones.`,
      });
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: "No se pudieron descartar",
        description: resolveActionErrorMessage(error, "No se pudieron descartar las facturas seleccionadas."),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmDeleteDialog(): Promise<void> {
    if (deleteDialogMode === "bulk") {
      await confirmDeleteSelected();
      return;
    }

    await confirmDelete();
  }

  async function handlePersist(item: ConciliationItem): Promise<void> {
    updateLoadingState(item.id, "persisting");

    try {
      const response = await apiRequest(`/api/conciliations/items/${item.id}/persist`, {
        method: "POST",
      });
      const payload = await response.json() as ConciliationPersistResult;
      await revalidateConciliations();
      router.refresh();

      if (payload.status === "persisted") {
        toastManager.add({
          type: "success",
          title: "Factura persistida",
          description: `La factura ${item.documentId} se guardó correctamente.`,
        });
        return;
      }

      toastManager.add({
        type: "error",
        title: payload.status === "duplicate" ? "Factura duplicada" : "No se pudo guardar",
        description: payload.message,
      });
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: "No se pudo guardar",
        description: resolveActionErrorMessage(error, "No se pudo guardar la factura."),
      });
    } finally {
      updateLoadingState(item.id, null);
    }
  }

  async function handlePersistBatch(itemIds?: string[]): Promise<void> {
    const nextItemIds = itemIds && itemIds.length > 0 ? itemIds : persistBatchAction.itemIds;

    if (!nextItemIds.length) {
      return;
    }

    try {
      const response = await apiRequest("/api/conciliations/items/persist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemIds: nextItemIds,
        }),
      });
      const payload = await response.json() as ConciliationBulkPersistResponse;
      await revalidateConciliations();
      router.refresh();
      selection.toggleMany(nextItemIds, false);
      toastManager.add({
        type: "success",
        title: "Facturas enviadas",
        description: `Se enviaron ${payload.queuedItems} facturas seleccionadas a la cola de guardar.`,
      });
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: "No se pudieron enviar",
        description: resolveActionErrorMessage(error, "No se pudieron enviar las facturas a guardar."),
      });
    }
  }

  function getSectionSelectionState(section: ConciliationSectionData): ConciliationSectionSelectionState {
    return buildConciliationSectionSelectionState(section, selectedItemIds);
  }

  function handlePersistSection(section: ConciliationSectionData): void {
    void handlePersistBatch(getSectionSelectionState(section).selectedValidatedItemIds);
  }

  function handleDeleteSection(section: ConciliationSectionData): void {
    void handleDeleteSelected(getSectionSelectionState(section).selectedDiscardableItemIds);
  }

  return {
    batchId: query.batchId,
    activeTab: query.tab,
    currentPage: data?.currentPage || query.page,
    totalPages: data?.totalPages || 1,
    totalCount: data?.totalCount || 0,
    processingCount: data?.processingCount || 0,
    readyCount: data?.readyCount || 0,
    validatedCount: data?.validatedCount || 0,
    persistBatchAction,
    startIndex: data?.startIndex || 0,
    isPageLoading,
    isDeleting,
    deleteDialogState,
    sections,
    loadingVouchers,
    removableCount: removableItemIds.length,
    selectedDiscardCount: selectedVisibleItemIds.length,
    allVisibleDiscardableSelected,
    isReviewModalOpen: reviewItemId !== null,
    reviewItem,
    isReviewItemLoading,
    reviewSourceUrl: reviewItemId && activeCompanyId
      ? `/api/conciliations/items/${reviewItemId}/source?companyId=${activeCompanyId}`
      : null,
    isVoucherSelected: (itemId: string) => selectedItemIds.includes(itemId),
    getSectionSelectionState,
    handleTabChange,
    handlePageChange,
    handleToggleItemSelection,
    handleToggleAllDiscardable,
    handleToggleVisibleSelection,
    handleReview,
    handleReviewModalOpenChange,
    handleDeleteDialogOpenChange,
    handleReviewSubmit,
    handleRegenerate,
    handlePersist,
    handlePersistBatch,
    handleDelete,
    handleDeleteSelected,
    confirmDelete,
    confirmDeleteSelected,
    confirmDeleteDialog,
    handlePersistSection,
    handleDeleteSection,
  };
}
