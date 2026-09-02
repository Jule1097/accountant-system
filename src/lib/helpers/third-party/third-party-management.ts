import { ApiRequestError } from 'src/lib/api/api-client'
import {
  thirdPartyPageSizeOptions,
  thirdPartyQueryDefaults,
  thirdPartyQueryParams,
  thirdPartySearchDebounceMs,
  thirdPartySortByOptions,
  thirdPartySortOrderOptions,
} from 'src/lib/constants/third-party'
import {
  createNormalizedSearchParams,
  readEnumParam,
  readOptionalStringParam,
  readPositiveIntegerParam,
} from 'src/lib/helpers/platform/query-state'
import {
  ClientSupplierEntityType,
  ClientSupplierListQueryState,
  ClientSupplierListResponse,
  ClientSupplierSortBy,
  ClientSupplierSortOrder,
} from 'src/types/third-party/third-party-resource'

export const clientSupplierPageSizeOptions = thirdPartyPageSizeOptions
export const clientSupplierSearchDebounceMs = thirdPartySearchDebounceMs

const clientSupplierSortByOptions: ClientSupplierSortBy[] = [...thirdPartySortByOptions]
const clientSupplierSortOrderOptions: ClientSupplierSortOrder[] = [...thirdPartySortOrderOptions]

export function readClientSupplierListQuery(searchParams: URLSearchParams): ClientSupplierListQueryState {
  const pageSize = readPositiveIntegerParam(searchParams, thirdPartyQueryParams.pageSize, thirdPartyQueryDefaults.pageSize)
  const normalizedPageSize = clientSupplierPageSizeOptions.includes(pageSize as typeof thirdPartyPageSizeOptions[number]) ? pageSize : thirdPartyQueryDefaults.pageSize

  return {
    page: readPositiveIntegerParam(searchParams, thirdPartyQueryParams.page, thirdPartyQueryDefaults.page),
    pageSize: normalizedPageSize,
    search: readOptionalStringParam(searchParams, thirdPartyQueryParams.search),
    sortBy: readEnumParam(searchParams, thirdPartyQueryParams.sortBy, clientSupplierSortByOptions, thirdPartyQueryDefaults.sortBy),
    sortOrder: readEnumParam(searchParams, thirdPartyQueryParams.sortOrder, clientSupplierSortOrderOptions, thirdPartyQueryDefaults.sortOrder),
    recordId: readOptionalStringParam(searchParams, thirdPartyQueryParams.recordId) ?? null,
  }
}

export function buildClientSupplierSearchParams(query: ClientSupplierListQueryState): URLSearchParams {
  return createNormalizedSearchParams(
    {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      recordId: query.recordId,
    },
    {
      page: thirdPartyQueryDefaults.page,
      pageSize: thirdPartyQueryDefaults.pageSize,
      sortBy: thirdPartyQueryDefaults.sortBy,
      sortOrder: thirdPartyQueryDefaults.sortOrder,
    }
  )
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

export function resetClientSupplierPage(query: ClientSupplierListQueryState): ClientSupplierListQueryState {
  return buildClientSupplierMutationQuery(query, { page: 1 })
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
