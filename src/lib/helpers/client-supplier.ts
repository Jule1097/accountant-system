import { URLSearchParams } from 'url'
import { ClientSupplierFilterParams, ClientSupplierWhereInput, ClientSupplierOrderByInput } from 'src/types/client-supplier'

export const clientSupplierSortByOptions = ['name', 'cuit'] as const
export const clientSupplierSortOrderOptions = ['asc', 'desc'] as const

const reservedClientSupplierQueryKeys = new Set([
  'page',
  'pageSize',
  'search',
  'sortBy',
  'sortOrder',
])

export function normalizeClientSupplierName(value: string): string {
  return value.trim().toLowerCase()
}

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
  return !searchParams.has('page')
    && !searchParams.has('pageSize')
    && !searchParams.has('search')
    && !searchParams.has('sortBy')
    && !searchParams.has('sortOrder')
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
  const direction = filters.sortOrder || 'asc'

  if (filters.sortBy === 'cuit') {
    return [{ cuit: direction }]
  }

  return [{ name: direction }]
}
