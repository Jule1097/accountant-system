import { URLSearchParams } from 'url'
import { ClientSupplierFilterParams, ClientSupplierWhereInput, ClientSupplierOrderByInput } from 'src/types/third-party/third-party-resource'
import {
  thirdPartyQueryDefaults,
  thirdPartyQueryParams,
  thirdPartySortByOptions,
  thirdPartySortOrderOptions,
} from 'src/lib/constants/third-party'

export const clientSupplierSortByOptions = thirdPartySortByOptions
export const clientSupplierSortOrderOptions = thirdPartySortOrderOptions

const reservedClientSupplierQueryKeys = new Set<string>([
  thirdPartyQueryParams.page,
  thirdPartyQueryParams.pageSize,
  thirdPartyQueryParams.search,
  thirdPartyQueryParams.sortBy,
  thirdPartyQueryParams.sortOrder,
])


export function buildClientSupplierFilters(searchParams: URLSearchParams): Record<string, string> {
  const filters: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    const normalizedValue = value.trim()

    if (!normalizedValue || reservedClientSupplierQueryKeys.has(key)) {
      continue
    }

    filters[key] = normalizedValue
  }

  return filters
}

export function shouldUseClientSupplierLegacyList(searchParams: URLSearchParams): boolean {
  return !searchParams.has(thirdPartyQueryParams.page)
    && !searchParams.has(thirdPartyQueryParams.pageSize)
    && !searchParams.has(thirdPartyQueryParams.search)
    && !searchParams.has(thirdPartyQueryParams.sortBy)
    && !searchParams.has(thirdPartyQueryParams.sortOrder)
}

export function buildClientSupplierWhereClause(companyId: string, filters: ClientSupplierFilterParams = {}): ClientSupplierWhereInput {
  const normalizedSearch = filters.search?.trim()
  const normalizedDigits = normalizedSearch?.replace(/\D/g, '')
  const whereClause: ClientSupplierWhereInput = {
    companyId,
  }

  if (!normalizedSearch) {
    return whereClause
  }

  whereClause.OR = [
    {
      name: {
        contains: normalizedSearch,
        mode: 'insensitive',
      },
    },
    {
      cuit: {
        contains: normalizedDigits || normalizedSearch,
      },
    },
  ]

  return whereClause
}

export function resolveClientSupplierOrderBy(filters: ClientSupplierFilterParams): ClientSupplierOrderByInput[] {
  const direction = filters.sortOrder || thirdPartyQueryDefaults.sortOrder

  if (filters.sortBy === 'cuit') {
    return [{ cuit: direction }]
  }

  return [{ name: direction }]
}
