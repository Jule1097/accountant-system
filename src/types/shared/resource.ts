import type { KeyedMutator, SWRConfiguration } from "swr"

export interface ResourceListAdapter<TQuery, TResponse, TData> {
  buildPath: (query: TQuery) => string | null
  fetch: (companyId: string, path: string) => Promise<TResponse>
  mapResponse: (response: TResponse) => TData
}

export interface UseResourceListOptions<TQuery, TResponse, TData> {
  query: TQuery
  adapter: ResourceListAdapter<TQuery, TResponse, TData>
  enabled?: boolean
  swrOptions?: ResourceSWRConfiguration<TData>
}

export interface ResourceDetailAdapter<TResponse, TItem> {
  buildPath: (resourceId: string) => string | null
  fetch: (companyId: string, path: string) => Promise<TResponse>
  mapResponse: (response: TResponse) => TItem
}

export interface UseResourceDetailOptions<TResponse, TItem> {
  resourceId: string | null
  adapter: ResourceDetailAdapter<TResponse, TItem>
  enabled?: boolean
  swrOptions?: ResourceSWRConfiguration<TItem>
}

export interface ResourceHookResult<TData> {
  data: TData | undefined
  error: unknown
  isLoading: boolean
  isValidating: boolean
  mutate: KeyedMutator<TData>
}

export interface ResourceDetailHookResult<TItem> {
  data: TItem | undefined
  error: unknown
  isLoading: boolean
  mutate: KeyedMutator<TItem>
}

export interface ResourceMutationAdapter<TCreate, TUpdate, TResponse> {
  create?: (scopeId: string | null, payload: TCreate) => Promise<TResponse>
  update?: (scopeId: string | null, resourceId: string, payload: TUpdate) => Promise<TResponse>
  remove?: (scopeId: string | null, resourceId: string) => Promise<TResponse>
}

export interface UseResourceMutationOptions<TCreate, TUpdate, TResponse> {
  adapter: ResourceMutationAdapter<TCreate, TUpdate, TResponse>
  scopeId?: string | null
}

export interface ResourceMutationHookResult<TCreate, TUpdate, TResponse> {
  isMutating: boolean
  error: unknown
  create: (payload: TCreate) => Promise<TResponse>
  update: (resourceId: string, payload: TUpdate) => Promise<TResponse>
  remove: (resourceId: string) => Promise<TResponse>
}

export type ResourceSWRConfiguration<TItem> = SWRConfiguration<TItem, unknown>
