"use client"

import { useCallback, useMemo, useState } from "react"
import { AccumulatedSelectionResult, UseAccumulatedSelectionOptions } from "src/types/shared/selection"

export function useAccumulatedSelection<TId extends string | number>({ companyId }: UseAccumulatedSelectionOptions): AccumulatedSelectionResult<TId> {
  const [selectedIds, setSelectedIds] = useState<TId[]>([])
  const [selectionCompanyId, setSelectionCompanyId] = useState(companyId)
  const scopedSelectedIds = useMemo(() => selectionCompanyId === companyId ? selectedIds : [],
    [companyId, selectedIds, selectionCompanyId])

  const toggle = useCallback((id: TId, selected: boolean): void => {
    if (selectionCompanyId !== companyId) {
      setSelectionCompanyId(companyId)
      setSelectedIds(selected ? [id] : [])
      return
    }

    setSelectedIds((currentIds) => {
      if (selected) {
        return currentIds.includes(id) ? currentIds : [...currentIds, id]
      }

      return currentIds.filter((currentId) => currentId !== id)
    })
  }, [companyId, selectionCompanyId])

  const toggleMany = useCallback((ids: TId[], selected: boolean): void => {
    if (selectionCompanyId !== companyId) {
      setSelectionCompanyId(companyId)
      setSelectedIds(selected ? ids : [])
      return
    }

    setSelectedIds((currentIds) => selected ? [...currentIds, ...ids.filter((id) => !currentIds.includes(id))] : currentIds.filter((id) => !ids.includes(id)))
  }, [companyId, selectionCompanyId])

  const clear = useCallback((): void => setSelectedIds([]), [])
  const isSelected = useCallback((id: TId): boolean => scopedSelectedIds.includes(id), [scopedSelectedIds])

  return { selectedIds: scopedSelectedIds, toggle, toggleMany, clear, isSelected }
}
