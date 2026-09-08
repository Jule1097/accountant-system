"use client"

import useSWR from "swr"
import { useCallback } from "react"
import { resourceMutationStatuses, resourceOperationErrors } from "src/lib/constants/resource"
import { useCompany } from "src/contexts/company-context"
import { useAsyncMutation } from "src/hooks/shared/use-async-mutation"
import { buildCompanyPathKey } from "src/lib/helpers/platform/swr"
import {
  ResourceDetailHookResult,
  ResourceHookResult,
  ResourceMutationHookResult,
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

export function useResourceMutation<TCreate, TUpdate, TResponse>({
  adapter,
  scopeId = null,
}: UseResourceMutationOptions<TCreate, TUpdate, TResponse>): ResourceMutationHookResult<TCreate, TUpdate, TResponse> {
  const mutation = useAsyncMutation()
  const run = useCallback(<TResult,>(operation: () => Promise<TResult>): Promise<TResult> => mutation.execute(operation), [mutation])

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

  return { isMutating: mutation.status === resourceMutationStatuses.loading, error: mutation.error, create, update, remove }
}
