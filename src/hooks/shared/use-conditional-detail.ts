"use client"

import { useEffect, useState } from "react"
import { resourceDetailModes, resourceDetailStates } from "src/lib/constants/resource"
import { resolveDetailState } from "src/lib/helpers/shared/conditional-detail"
import { ConditionalDetailResult, DetailState, UseConditionalDetailOptions } from "src/types/shared/conditional-detail"

export function useConditionalDetail<TRecord>({ mode, id, open = true, currentRecord, fetchById }: UseConditionalDetailOptions<TRecord>): ConditionalDetailResult<TRecord> {
  const [cache, setCache] = useState<Record<string, TRecord>>({})
  const [state, setState] = useState<DetailState>(resourceDetailStates.idle)
  const [record, setRecord] = useState<TRecord | undefined>(currentRecord)
  const [error, setError] = useState<unknown>(undefined)

  const cachedRecord = id ? cache[id] : undefined
  const shouldLoad = mode === resourceDetailModes.edit && Boolean(open && id && !cachedRecord)
  const resolvedState = resolveDetailState(mode, open, id, currentRecord, state, shouldLoad)

  useEffect(() => {
    if (!shouldLoad || !id) return

    let isActive = true
    const loadRecord = async (): Promise<void> => {
      setState(resourceDetailStates.loading)

      try {
        const loadedRecord = await fetchById(id)
        if (!isActive) {
          return
        }

        setCache((currentCache) => ({ ...currentCache, [id]: loadedRecord }))
        setRecord(loadedRecord)
        setState(resourceDetailStates.ready)
      } catch (loadError: unknown) {
        if (!isActive) {
          return
        }

        setError(loadError)
        setState(resourceDetailStates.error)
      }
    }

    void loadRecord()

    return () => {
      isActive = false
    }
  }, [fetchById, id, shouldLoad])

  const resolvedRecord = mode === resourceDetailModes.detail ? currentRecord : cachedRecord ?? record
  return { state: resolvedState, record: resolvedRecord, error }
}
