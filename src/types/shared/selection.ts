export interface UseAccumulatedSelectionOptions {
  companyId: string | null
}

export interface AccumulatedSelectionResult<TId extends string | number> {
  selectedIds: TId[]
  toggle: (id: TId, selected: boolean) => void
  toggleMany: (ids: TId[], selected: boolean) => void
  clear: () => void
  isSelected: (id: TId) => boolean
}
