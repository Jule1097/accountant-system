export interface ResourceDeletionCoordinatorOptions<TRecord, TQuery> {
  pendingRecord: TRecord | null
  getResourceId: (record: TRecord) => string | null
  deleteResource: (resourceId: string) => Promise<unknown>
  isDeleting: boolean
  resolveNextQuery: () => TQuery
  updateQuery: (query: TQuery) => void
  clearPendingRecord: () => void
  refreshList: () => Promise<void>
}

export interface ResourceDeletionCoordinatorResult {
  isDeleting: boolean
  confirmDelete: () => Promise<void>
}
