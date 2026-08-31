import { ApiRequestError } from 'src/lib/api/api-client'
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
} from 'src/types/client-supplier/client-supplier'

export const clientSupplierPageSizeOptions = [10, 20, 50] as const

const clientSupplierSortByOptions: ClientSupplierSortBy[] = ['name', 'cuit']
const clientSupplierSortOrderOptions: ClientSupplierSortOrder[] = ['asc', 'desc']

export function readClientSupplierListQuery(searchParams: URLSearchParams): ClientSupplierListQueryState {
  const pageSize = readPositiveIntegerParam(searchParams, 'pageSize', 10)
  const normalizedPageSize = clientSupplierPageSizeOptions.includes(pageSize as 10 | 20 | 50) ? pageSize : 10

  return {
    page: readPositiveIntegerParam(searchParams, 'page', 1),
    pageSize: normalizedPageSize,
    search: readOptionalStringParam(searchParams, 'search'),
    sortBy: readEnumParam(searchParams, 'sortBy', clientSupplierSortByOptions, 'name'),
    sortOrder: readEnumParam(searchParams, 'sortOrder', clientSupplierSortOrderOptions, 'asc'),
    recordId: readOptionalStringParam(searchParams, 'recordId') ?? null,
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
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
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
  params.delete('recordId')
  params.set('page', String(query.page))
  params.set('pageSize', String(query.pageSize))

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
