"use client"

import { useResourceDetail, useResourceList } from "src/hooks/shared/use-resource"
import {
  createClientSupplierDetailAdapter,
  createClientSupplierListAdapter,
} from "src/lib/helpers/third-party/third-party-resource-adapter"
import {
  ClientSupplierEntityType,
  ClientSupplierListQueryState,
} from "src/types/third-party/third-party-resource"

export function useClientsSuppliers(type: ClientSupplierEntityType, query: ClientSupplierListQueryState) {
  const resource = useResourceList({
    query,
    adapter: createClientSupplierListAdapter(type),
    swrOptions: { revalidateOnReconnect: false },
  })

  return {
    data: resource.data,
    error: resource.error,
    isLoading: resource.isLoading,
    isValidating: resource.isValidating,
    mutate: resource.mutate,
  }
}

export function useClientSupplierById(type: ClientSupplierEntityType, id: string) {
  const resource = useResourceDetail({
    resourceId: id || null,
    adapter: createClientSupplierDetailAdapter(type),
    swrOptions: { keepPreviousData: true },
  })

  return {
    data: resource.data,
    error: resource.error,
    isLoading: resource.isLoading,
    mutate: resource.mutate,
  }
}
