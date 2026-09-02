"use client"

import useSWR from "swr"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { defaultResourceSearchDebounceMs, resourceOperationErrors } from "src/lib/constants/resource"
import { useCompany } from "src/contexts/company-context"
import { buildCompanyPathKey } from "src/lib/helpers/platform/swr"
import {
  ResourceDetailHookResult,
  ResourceHookResult,
  ResourceMutationHookResult,
  ResourceQueryStateOptions,
  ResourceQueryStateResult,
  UseResourceDetailOptions,
  UseResourceListOptions,
  UseResourceMutationOptions,
} from "src/types/shared/resource"

export function useResourceList<TQuery, TResponse, TData>({
  query,
  adapter,
  enabled = true,
  swrOptions,
}: UseResourceListOptions<TQuery, TResponse, TData>): ResourceHookResult<TData> {
  const { activeCompanyId, loading: isCompanyLoading } = useCompany()
  const path = isCompanyLoading || !enabled ? null : adapter.buildPath(query)
  const key = buildCompanyPathKey(activeCompanyId, path, !isCompanyLoading && enabled)
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    ([companyId, requestPath]) => adapter.fetch(companyId, requestPath).then(adapter.mapResponse),
    { keepPreviousData: true, revalidateOnFocus: false, ...swrOptions }
  )

  return { data, error, isLoading, isValidating, mutate }
}

export function useResourceDetail<TResponse, TItem>({
  resourceId,
  adapter,
  enabled = true,
  swrOptions,
}: UseResourceDetailOptions<TResponse, TItem>): ResourceDetailHookResult<TItem> {
  const { activeCompanyId, loading: isCompanyLoading } = useCompany()
  const path = isCompanyLoading || !enabled || !resourceId ? null : adapter.buildPath(resourceId)
  const key = buildCompanyPathKey(activeCompanyId, path, !isCompanyLoading && enabled && Boolean(resourceId))
  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([companyId, requestPath]) => adapter.fetch(companyId, requestPath).then(adapter.mapResponse),
    { revalidateOnFocus: false, ...swrOptions }
  )

  return { data, error, isLoading, mutate }
}

export function useResourceQueryState<TQuery extends object>({
  initialQuery,
  sourceQuery,
  searchKey,
  debounceMs = defaultResourceSearchDebounceMs,
  onDebouncedSearch,
}: ResourceQueryStateOptions<TQuery>): ResourceQueryStateResult<TQuery> {
  const initialQueryRef = useRef(initialQuery)
  const sourceOrInitialQuery = sourceQuery ?? initialQuery
  const sourceSearchValue = useMemo(
    () => searchKey ? String(sourceOrInitialQuery[searchKey] ?? "") : "",
    [searchKey, sourceOrInitialQuery]
  )
  const initialSearchValue = sourceSearchValue
  const [query, setQuery] = useState(() => initialQuery)
  const [localSearchState, setLocalSearchState] = useState({
    sourceValue: sourceSearchValue,
    value: initialSearchValue,
  })
  const searchTimeoutRef = useRef<number | null>(null)
  const hasInitializedSearchRef = useRef(false)
  const searchValue = sourceQuery && localSearchState.sourceValue !== sourceSearchValue
    ? sourceSearchValue
    : localSearchState.value

  const setSearchValue = useCallback((value: string): void => {
    setLocalSearchState({ sourceValue: sourceSearchValue, value })
  }, [sourceSearchValue])

  const cancelPendingSearch = useCallback((): void => {
    if (searchTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = null
  }, [])

  useEffect(() => {
    if (!searchKey || !onDebouncedSearch) {
      return
    }

    if (!hasInitializedSearchRef.current) {
      hasInitializedSearchRef.current = true
      return
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      searchTimeoutRef.current = null
      onDebouncedSearch(searchValue)
    }, debounceMs)
    return cancelPendingSearch
  }, [cancelPendingSearch, debounceMs, onDebouncedSearch, searchKey, searchValue])

  const updateQuery = useCallback((values: Partial<TQuery>): void => {
    setQuery((currentQuery) => ({ ...currentQuery, ...values }))
  }, [])

  const resetQuery = useCallback((): void => {
    setQuery(initialQueryRef.current)
    setLocalSearchState({ sourceValue: sourceSearchValue, value: initialSearchValue })
  }, [initialSearchValue, sourceSearchValue])

  return {
    query: sourceQuery ?? query,
    searchValue,
    setSearchValue,
    updateQuery,
    resetQuery,
    cancelPendingSearch,
  }
}

export function useResourceMutation<TCreate, TUpdate, TResponse>({
  adapter,
  scopeId = null,
}: UseResourceMutationOptions<TCreate, TUpdate, TResponse>): ResourceMutationHookResult<TCreate, TUpdate, TResponse> {
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<unknown>(undefined)

  const run = useCallback(async <TResult,>(operation: () => Promise<TResult>): Promise<TResult> => {
    setIsMutating(true)
    setError(undefined)

    try {
      return await operation()
    } catch (operationError) {
      setError(operationError)
      throw operationError
    } finally {
      setIsMutating(false)
    }
  }, [])

  const create = useCallback(
    (payload: TCreate) => {
      if (!adapter.create) {
        return Promise.reject(new Error(resourceOperationErrors.createUnavailable))
      }
      return run(() => adapter.create!(scopeId, payload))
    },
    [adapter, run, scopeId]
  )

  const update = useCallback(
    (resourceId: string, payload: TUpdate) => {
      if (!adapter.update) {
        return Promise.reject(new Error(resourceOperationErrors.updateUnavailable))
      }
      return run(() => adapter.update!(scopeId, resourceId, payload))
    },
    [adapter, run, scopeId]
  )

  const remove = useCallback(
    (resourceId: string) => {
      if (!adapter.remove) {
        return Promise.reject(new Error(resourceOperationErrors.deleteUnavailable))
      }
      return run(() => adapter.remove!(scopeId, resourceId))
    },
    [adapter, run, scopeId]
  )

  return { isMutating, error, create, update, remove }
}
