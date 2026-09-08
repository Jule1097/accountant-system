import { ApiRequestError } from 'src/lib/api/api-client'
import {
  thirdPartyPageSizeOptions,
  thirdPartyQueryDefaults,
  thirdPartyQueryParams,
  thirdPartySearchDebounceMs,
  thirdPartySortByOptions,
  thirdPartySortOrderOptions,
} from 'src/lib/constants/third-party'
import { parseUrlState, updateUrlState } from 'src/lib/helpers/shared/url-state'
import {
  ClientSupplierEntityType,
  ClientSupplierListQueryState,
  ClientSupplierListResponse,
  ClientSupplierSortBy,
  ClientSupplierSortOrder,
} from 'src/types/third-party/third-party-resource'
import { UrlParameterConfigs } from 'src/types/shared/url-state'

export const clientSupplierPageSizeOptions = thirdPartyPageSizeOptions
export const clientSupplierSearchDebounceMs = thirdPartySearchDebounceMs

export const clientSupplierTableParameters = {
  page: { defaultValue: thirdPartyQueryDefaults.page, parse: (value: string | null) => Number(value), normalize: (value: number) => Number.isInteger(value) && value > 0 ? value : thirdPartyQueryDefaults.page, serialize: (value: number) => value === thirdPartyQueryDefaults.page ? null : String(value) },
  pageSize: { defaultValue: thirdPartyQueryDefaults.pageSize, parse: (value: string | null) => Number(value), normalize: (value: number) => clientSupplierPageSizeOptions.includes(value as typeof thirdPartyPageSizeOptions[number]) ? value : thirdPartyQueryDefaults.pageSize, serialize: (value: number) => value === thirdPartyQueryDefaults.pageSize ? null : String(value), allowedValues: thirdPartyPageSizeOptions },
  search: { defaultValue: undefined as string | undefined, parse: (value: string | null) => value ?? undefined, serialize: (value: string | undefined) => value || null },
  sortBy: { defaultValue: thirdPartyQueryDefaults.sortBy, serialize: (value: ClientSupplierSortBy) => value === thirdPartyQueryDefaults.sortBy ? null : value, allowedValues: thirdPartySortByOptions },
  sortOrder: { defaultValue: thirdPartyQueryDefaults.sortOrder, serialize: (value: ClientSupplierSortOrder) => value === thirdPartyQueryDefaults.sortOrder ? null : value, allowedValues: thirdPartySortOrderOptions },
  recordId: { defaultValue: null, parse: (value: string | null) => value },
} satisfies UrlParameterConfigs

export function readClientSupplierListQuery(searchParams: URLSearchParams): ClientSupplierListQueryState {
  return parseUrlState(searchParams, clientSupplierTableParameters) as ClientSupplierListQueryState
}

export function buildClientSupplierSearchParams(query: ClientSupplierListQueryState): URLSearchParams {
  return updateUrlState(new URLSearchParams(), clientSupplierTableParameters, query)
}

export function buildClientSupplierQuery(searchParams: URLSearchParams, nextQuery: ClientSupplierListQueryState): string {
  const normalizedParams = buildClientSupplierSearchParams(nextQuery)
  void searchParams
  const queryString = normalizedParams.toString()

  if (!queryString) {
    return ''
  }

  return `?${queryString}`
}

export function buildClientSupplierCollectionPath(type: ClientSupplierEntityType, query: ClientSupplierListQueryState): string {
  const params = buildClientSupplierSearchParams(query)
  params.delete(thirdPartyQueryParams.recordId)
  params.set(thirdPartyQueryParams.page, String(query.page))
  params.set(thirdPartyQueryParams.pageSize, String(query.pageSize))

  const queryString = params.toString()

  if (!queryString) {
    return `/api/${type}`
  }

  return `/api/${type}?${queryString}`
}

export function buildClientSupplierDetailPath(type: ClientSupplierEntityType, id: string): string {
  return `/api/${type}/${id}`
}

export function buildClientSupplierMutationQuery(
  query: ClientSupplierListQueryState,
  values: Partial<ClientSupplierListQueryState>
): ClientSupplierListQueryState {
  return {
    ...query,
    ...values,
  }
}

export function buildClientSupplierPageLabel(data: ClientSupplierListResponse<unknown>): string {
  const from = (data.page - 1) * data.pageSize + (data.total === 0 ? 0 : 1)
  const to = Math.min(data.page * data.pageSize, data.total)
  return `Mostrando ${from}-${to} de ${data.total} (Pág. ${data.page} de ${data.totalPages})`
}

export function moveClientSupplierPageBack(query: ClientSupplierListQueryState): ClientSupplierListQueryState {
  if (query.page <= 1) {
    return query
  }

  return buildClientSupplierMutationQuery(query, { page: query.page - 1 })
}

export function resolveClientSupplierManagementError(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiRequestError) {
    return error.message
  }

  return fallbackMessage
}
