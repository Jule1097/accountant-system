"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useCompany } from "src/contexts/company-context";
import { apiRequest } from "src/lib/api-client";
import {
  areAllVisibleDiscardableSelected,
  buildConciliationsPath,
  buildConciliationsQueryString,
  mergeSelectedItemIds,
  readConciliationsQuery,
  removeSelectedItemIds,
  resolveActionErrorMessage,
  resolveConciliationsRefreshInterval,
  resolveSelectedVisibleItemIds,
} from "src/lib/helpers/conciliations-state";
import { buildCompanyPathKey, companyPathFetcher, revalidateCompanyScope } from "src/lib/helpers/swr";
import { useToastManager } from "src/components/ui/toast";
import {
  ConciliationBulkDiscardResponse,
  ConciliationDeleteDialogState,
  ConciliationItem,
  ConciliationItemAction,
  ConciliationPersistBatchActionState,
  ConciliationPersistResult,
  ConciliationSectionData,
  ConciliationsPageData,
  ConciliationsQueryState,
  ConciliationTab,
} from "src/types/conciliations";
import { ParserBatchItemContextRecord } from "src/types/parser-batch";
import { VoucherFormPayload } from "src/types/voucher-form";

function flattenSectionItems(sections: ConciliationSectionData[]): ConciliationItem[] {
  return sections.flatMap((section) => section.items);
}

function getValidatedVisibleItems(items: ConciliationItem[], selectedItemIds: string[]): ConciliationItem[] {
  return items.filter((item) => item.status === "Validada" && selectedItemIds.includes(item.id));
}

function getUniqueBatchIds(items: ConciliationItem[]): string[] {
  return [...new Set(items.map((item) => item.batchId))];
}

export function useConciliations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toastManager = useToastManager();
  const { activeCompanyId, loading: isCompanyLoading } = useCompany();
  const [loadingVouchers, setLoadingVouchers] = useState<Record<string, ConciliationItemAction | undefined>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [reviewItemId, setReviewItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ConciliationItem | null>(null);
  const [pendingBulkDeleteItemIds, setPendingBulkDeleteItemIds] = useState<string[]>([]);
  const [deleteDialogMode, setDeleteDialogMode] = useState<"single" | "bulk" | null>(null);
  const handledNotificationIdRef = useRef<string | null>(null);
  const handledStaleBatchPathRef = useRef<string | null>(null);
  const query = useMemo(() => readConciliationsQuery(searchParams), [searchParams]);
  const notificationId = searchParams.get("notificationId");
  const path = buildConciliationsPath(query);
  const key = buildCompanyPathKey(activeCompanyId, path);
  const { data, mutate, isLoading } = useSWR<ConciliationsPageData>(
    key,
    ([companyId, requestPath]: readonly [string, string]) =>
      companyPathFetcher<ConciliationsPageData>(companyId, requestPath),
    {
      refreshInterval: (currentData: ConciliationsPageData | undefined) =>
        resolveConciliationsRefreshInterval(currentData),
      revalidateOnFocus: true,
      refreshWhenHidden: false,
    }
  );
  const reviewItemKey = buildCompanyPathKey(
    activeCompanyId,
    reviewItemId ? `/api/vouchers/parse/items/${reviewItemId}` : null
  );
  const { data: reviewItem, isLoading: isReviewItemLoading } = useSWR(
    reviewItemKey,
    ([companyId, requestPath]: readonly [string, string]) =>
      companyPathFetcher<ParserBatchItemContextRecord>(companyId, requestPath)
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
  const persistBatchAction = useMemo<ConciliationPersistBatchActionState>(() => {
    const validatedItems = getValidatedVisibleItems(visibleItems, selectedItemIds);

    if (query.batchId) {
      return {
        batchId: query.batchId,
        selectedValidatedCount: validatedItems.length,
        canPersist: (data?.validatedCount || 0) > 0,
      };
    }

    if (validatedItems.length === 0) {
      return {
        batchId: undefined,
        selectedValidatedCount: 0,
        canPersist: false,
      };
    }

    const batchIds = getUniqueBatchIds(validatedItems);

    if (batchIds.length !== 1) {
      return {
        batchId: undefined,
        selectedValidatedCount: validatedItems.length,
        canPersist: false,
      };
    }

    return {
      batchId: batchIds[0],
      selectedValidatedCount: validatedItems.length,
      canPersist: true,
    };
  }, [data?.validatedCount, query.batchId, selectedItemIds, visibleItems]);
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
    if (searchParams.has("tab") && searchParams.has("page")) {
      return;
    }

    router.replace(`${pathname}?${buildConciliationsQueryString(query)}`, { scroll: false });
  }, [pathname, query, router, searchParams]);

  useEffect(() => {
    if (!data || query.page <= data.totalPages) {
      return;
    }

    router.push(`${pathname}?${buildConciliationsQueryString({ ...query, page: data.totalPages })}`, { scroll: false });
  }, [data, pathname, query, router]);

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

  const hasNormalizedQueryParams = searchParams.has("tab") && searchParams.has("page");
  const isPageLoading = isCompanyLoading || !hasNormalizedQueryParams || (isLoading && !data);

  function syncQuery(nextQuery: ConciliationsQueryState): void {
    router.push(`${pathname}?${buildConciliationsQueryString(nextQuery)}`, { scroll: false });
  }

  function updateLoadingState(itemId: string, action: ConciliationItemAction | null): void {
    setLoadingVouchers((currentValue) => ({
      ...currentValue,
      [itemId]: action || undefined,
    }));
  }

  async function revalidateConciliations(): Promise<void> {
    await mutate();

    if (!activeCompanyId) {
      return;
    }

    await revalidateCompanyScope(activeCompanyId, ["/api/conciliations"]);
  }

  function handleTabChange(tab: ConciliationTab) {
    setSelectedItemIds([]);
    syncQuery({
      ...query,
      tab,
      page: 1,
    });
  }

  function handlePageChange(page: number) {
    setSelectedItemIds([]);
    syncQuery({
      ...query,
      page,
    });
  }

  function handleToggleItemSelection(item: ConciliationItem, checked: boolean): void {
    if (!item.canDiscard) {
      return;
    }

    setSelectedItemIds((currentValue) => {
      if (checked) {
        return currentValue.includes(item.id) ? currentValue : [...currentValue, item.id];
      }

      return currentValue.filter((itemId) => itemId !== item.id);
    });
  }

  function handleToggleAllDiscardable(checked: boolean): void {
    if (!checked) {
      setSelectedItemIds((currentValue) => removeSelectedItemIds(currentValue, removableItemIds));
      return;
    }

    setSelectedItemIds((currentValue) => mergeSelectedItemIds(currentValue, removableItemIds));
  }

  function handleToggleVisibleSelection(itemIds: string[], checked: boolean): void {
    if (!checked) {
      setSelectedItemIds((currentValue) => removeSelectedItemIds(currentValue, itemIds));
      return;
    }

    setSelectedItemIds((currentValue) => mergeSelectedItemIds(currentValue, itemIds));
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
      setSelectedItemIds((currentValue) => removeSelectedItemIds(currentValue, [pendingDeleteItem.id]));
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
      setSelectedItemIds((currentValue) => removeSelectedItemIds(currentValue, pendingBulkDeleteItemIds));
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

  async function handlePersistBatch(): Promise<void> {
    if (!persistBatchAction.batchId) {
      return;
    }

    try {
      const response = await apiRequest(`/api/conciliations/batches/${persistBatchAction.batchId}/persist`, {
        method: "POST",
      });
      const payload = await response.json() as { queuedItems: number };
      await revalidateConciliations();
      router.refresh();
      toastManager.add({
        type: "success",
        title: "Facturas enviadas",
        description: `Se enviaron ${payload.queuedItems} facturas a la cola de guardar.`,
      });
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: "No se pudieron enviar",
        description: resolveActionErrorMessage(error, "No se pudieron enviar las facturas a guardar."),
      });
    }
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
    getSelectedCount: (itemIds: string[]) => itemIds.filter((itemId) => selectedItemIds.includes(itemId)).length,
    areAllSectionItemsSelected: (itemIds: string[]) => areAllVisibleDiscardableSelected(itemIds, selectedItemIds),
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
  };
}
