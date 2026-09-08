/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { resolveResourceDeletionQuery } from "src/lib/helpers/shared/resource-deletion"
import { useResourceDeletionCoordinator } from "src/hooks/shared/use-resource-deletion"

describe("resource deletion coordinator", () => {
  it("resolves the next query through a pure pagination transition", () => {
    const movePageBack = jest.fn((query: { page: number }) => ({ page: query.page - 1 }))

    expect(resolveResourceDeletionQuery({ page: 2 }, true, movePageBack)).toEqual({ page: 1 })
    expect(resolveResourceDeletionQuery({ page: 1 }, false, movePageBack)).toEqual({ page: 1 })
    expect(movePageBack).toHaveBeenCalledTimes(1)
  })

  it("coordinates successful deletion without owning feedback or modal state", async () => {
    const deleteResource = jest.fn().mockResolvedValue(undefined)
    const updateQuery = jest.fn()
    const clearPendingRecord = jest.fn()
    const refreshList = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useResourceDeletionCoordinator({
      pendingRecord: { id: "resource-1" },
      getResourceId: (record: { id: string }) => record.id,
      deleteResource,
      isDeleting: false,
      resolveNextQuery: () => ({ page: 1 }),
      updateQuery,
      clearPendingRecord,
      refreshList,
    }))

    await act(async () => {
      await result.current.confirmDelete()
    })

    expect(deleteResource).toHaveBeenCalledWith("resource-1")
    expect(updateQuery).toHaveBeenCalledWith({ page: 1 })
    expect(clearPendingRecord).toHaveBeenCalled()
    expect(refreshList).toHaveBeenCalled()
  })

  it("does not update or refresh when deletion fails", async () => {
    const error = new Error("Delete failed")
    const deleteResource = jest.fn().mockRejectedValue(error)
    const updateQuery = jest.fn()
    const clearPendingRecord = jest.fn()
    const refreshList = jest.fn()
    const { result } = renderHook(() => useResourceDeletionCoordinator({
      pendingRecord: { id: "resource-1" },
      getResourceId: (record: { id: string }) => record.id,
      deleteResource,
      isDeleting: false,
      resolveNextQuery: () => ({ page: 1 }),
      updateQuery,
      clearPendingRecord,
      refreshList,
    }))

    await expect(act(async () => result.current.confirmDelete())).rejects.toBe(error)
    expect(updateQuery).not.toHaveBeenCalled()
    expect(clearPendingRecord).not.toHaveBeenCalled()
    expect(refreshList).not.toHaveBeenCalled()
  })
})
