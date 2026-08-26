"use client"

import useSWR from 'swr'
import { useCompany } from 'src/contexts/company-context'
import {
  buildClientSupplierCollectionPath,
  buildClientSupplierDetailPath,
} from 'src/lib/helpers/client-supplier/client-supplier-management'
import { buildCompanyPathKey, companyPathFetcher } from 'src/lib/helpers/platform/swr'
import {
  ClientSupplierEntityType,
  ClientSupplierListQueryState,
  ClientSupplierListResponse,
  ClientSupplierRecord,
} from 'src/types/client-supplier/client-supplier'

export function useClientsSuppliers(type: ClientSupplierEntityType, query: ClientSupplierListQueryState) {
  const { activeCompanyId } = useCompany()
  const key = buildCompanyPathKey(activeCompanyId, buildClientSupplierCollectionPath(type, query))
  const { data, isLoading, mutate } = useSWR(
    key,
    ([companyId, path]) => companyPathFetcher<ClientSupplierListResponse<ClientSupplierRecord>>(companyId, path),
    {
      keepPreviousData: true,
    }
  )

  return {
    data,
    isLoading,
    mutate,
  }
}

export function useClientSupplierById(type: ClientSupplierEntityType, id: string) {
  const { activeCompanyId } = useCompany()
  const path = id ? buildClientSupplierDetailPath(type, id) : null
  const key = buildCompanyPathKey(activeCompanyId, path)
  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([companyId, requestPath]) => companyPathFetcher<ClientSupplierRecord>(companyId, requestPath),
    {
      keepPreviousData: true,
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
