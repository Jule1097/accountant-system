"use client"

import { useCallback, useState } from "react"
import { resourceMutationStatuses } from "src/lib/constants/resource"
import { AsyncMutationResult, AsyncMutationStatus, UseAsyncMutationOptions } from "src/types/shared/async-mutation"

export function useAsyncMutation<TResult = unknown>({ onSuccess }: UseAsyncMutationOptions<TResult> = {}): AsyncMutationResult<TResult> {
  const [status, setStatus] = useState<AsyncMutationStatus>(resourceMutationStatuses.idle)
  const [error, setError] = useState<unknown>(undefined)

  const execute = useCallback(async <TResultOverride,>(operation: () => Promise<TResultOverride>): Promise<TResultOverride> => {
    setStatus(resourceMutationStatuses.loading)
    setError(undefined)

    try {
      const result = await operation()
      await onSuccess?.(result as TResult)
      setStatus(resourceMutationStatuses.success)
      return result
    } catch (operationError) {
      setError(operationError)
      setStatus(resourceMutationStatuses.error)
      throw operationError
    }
  }, [onSuccess])

  const reset = useCallback((): void => {
    setStatus(resourceMutationStatuses.idle)
    setError(undefined)
  }, [])

  return { status, error, execute, reset }
}
