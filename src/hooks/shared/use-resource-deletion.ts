"use client"

import { useCallback } from "react"
import { ResourceDeletionCoordinatorOptions, ResourceDeletionCoordinatorResult } from "src/types/shared/resource-deletion"

export function useResourceDeletionCoordinator<TRecord, TQuery>({
  pendingRecord,
  getResourceId,
  deleteResource,
  isDeleting,
  resolveNextQuery,
  updateQuery,
  clearPendingRecord,
  refreshList,
}: ResourceDeletionCoordinatorOptions<TRecord, TQuery>): ResourceDeletionCoordinatorResult {
  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!pendingRecord) {
      return
    }

    const resourceId = getResourceId(pendingRecord)
    if (!resourceId) {
      return
    }

    await deleteResource(resourceId)
    updateQuery(resolveNextQuery())
    clearPendingRecord()
    await refreshList()
  }, [clearPendingRecord, deleteResource, getResourceId, pendingRecord, refreshList, resolveNextQuery, updateQuery])

  return { isDeleting, confirmDelete }
}
