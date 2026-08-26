"use client"

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useToastManager } from 'src/components/ui/toast'
import { useCompany } from 'src/contexts/company-context'
import { useClientSupplierById, useClientsSuppliers } from 'src/hooks/use-clients-suppliers'
import { apiRequest } from 'src/lib/api-client'
import {
  buildClientSupplierMutationQuery,
  buildClientSupplierQuery,
  moveClientSupplierPageBack,
  readClientSupplierListQuery,
  resetClientSupplierPage,
  resolveClientSupplierManagementError,
} from 'src/lib/helpers/client-supplier-management'
import { revalidateCompanyScope } from 'src/lib/helpers/swr'
import {
  ClientSupplierEntityType,
  ClientSupplierListQueryState,
  ClientSupplierRecord,
  ClientSupplierSortBy,
  ClientSupplierSortOrder,
  UseClientsSuppliersManagementResult,
} from 'src/types/client-supplier'

const emptyQueryState: ClientSupplierListQueryState = {
  page: 1,
  pageSize: 10,
  sortBy: 'name',
  sortOrder: 'asc',
  recordId: null,
}

export function useClientsSuppliersManagement(type: ClientSupplierEntityType): UseClientsSuppliersManagementResult {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [recordPendingDelete, setRecordPendingDelete] = useState<ClientSupplierRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewRecordId, setViewRecordId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const toastManager = useToastManager()
  const { activeCompanyId } = useCompany()
  const previousCompanyIdRef = useRef<string | null>(activeCompanyId)
  const currentQueryString = useMemo(() => searchParams.toString(), [searchParams])
  const query = useMemo(() => readClientSupplierListQuery(searchParams), [searchParams])
  const querySearchValue = query.search || ''
  const [searchState, setSearchState] = useState({
    sourceQuery: querySearchValue,
    value: querySearchValue,
  })
  const searchValue = searchState.sourceQuery === querySearchValue ? searchState.value : querySearchValue
  const { data, isLoading: isTableLoading, mutate } = useClientsSuppliers(type, query)
  const {
    data: recordDetail,
    error: recordDetailError,
    isLoading: isRecordDetailLoading,
    mutate: mutateRecordDetail,
  } = useClientSupplierById(type, query.recordId || '')
  const selectedRecordFromList = useMemo(() => {
    if (!viewRecordId) {
      return undefined
    }

    return data?.items?.find((item) => item.id === viewRecordId)
  }, [data?.items, viewRecordId])

  const replaceQuery = useCallback((nextQuery: ClientSupplierListQueryState): void => {
    const nextUrl = `${pathname}${buildClientSupplierQuery(new URLSearchParams(currentQueryString), nextQuery)}`

    startTransition(() => {
      router.replace(nextUrl, { scroll: false })
    })
  }, [currentQueryString, pathname, router])

  useEffect(() => {
    if (searchValue === querySearchValue) {
      return
    }

    const timeoutId = setTimeout(() => {
      replaceQuery(
        resetClientSupplierPage(
          buildClientSupplierMutationQuery(query, {
            search: searchValue || undefined,
          })
        )
      )
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [query, querySearchValue, replaceQuery, searchValue])

  useEffect(() => {
    if (previousCompanyIdRef.current === activeCompanyId) {
      return
    }

    previousCompanyIdRef.current = activeCompanyId
    setViewRecordId(null)
    replaceQuery(emptyQueryState)
  }, [activeCompanyId, replaceQuery])

  const revalidateScope = async (): Promise<void> => {
    if (!activeCompanyId) {
      return
    }

    await Promise.all([
      mutate(),
      revalidateCompanyScope(activeCompanyId, ['/api/clients', '/api/suppliers']),
    ])
  }

  const openCreateModal = (): void => {
    setIsCreateModalOpen(true)
  }

  const handleCreateModalOpenChange = (open: boolean): void => {
    setIsCreateModalOpen(open)
  }

  const handleEditModalOpenChange = (open: boolean): void => {
    if (open) {
      return
    }

    replaceQuery(buildClientSupplierMutationQuery(query, { recordId: null }))
    setViewRecordId(null)
  }

  const handleSelectRecord = (record: ClientSupplierRecord, action: 'view' | 'edit' = 'view'): void => {
    if (!record.id) {
      return
    }

    if (action === 'edit') {
      replaceQuery(buildClientSupplierMutationQuery(query, { recordId: record.id }))
      return
    }

    setViewRecordId(record.id)
  }

  const handleCreateSuccess = async (): Promise<void> => {
    await revalidateScope()
  }

  const handleEditSuccess = async (): Promise<void> => {
    await Promise.all([revalidateScope(), mutateRecordDetail()])
  }

  const handleDeleteRecord = (record: ClientSupplierRecord): void => {
    setRecordPendingDelete(record)
  }

  const handleDeleteDialogOpenChange = (open: boolean): void => {
    if (open) {
      return
    }

    setRecordPendingDelete(null)
  }

  const handleRecordDetailError = (error: unknown): void => {
    toastManager.add({
      type: 'error',
      title: type === 'clients' ? 'Cliente no disponible' : 'Proveedor no disponible',
      description: resolveClientSupplierManagementError(
        error,
        type === 'clients'
          ? 'No se pudo cargar el cliente seleccionado.'
          : 'No se pudo cargar el proveedor seleccionado.'
      ),
    })
    replaceQuery(buildClientSupplierMutationQuery(query, { recordId: null }))
    setViewRecordId(null)
  }

  const handleSearchChange = (value: string): void => {
    setSearchState({
      sourceQuery: querySearchValue,
      value,
    })
  }

  const handleClearFilters = (): void => {
    replaceQuery({
      ...emptyQueryState,
      recordId: query.recordId,
    })
  }

  const handleSortChange = (sortBy: ClientSupplierSortBy, sortOrder: ClientSupplierSortOrder): void => {
    replaceQuery(buildClientSupplierMutationQuery(query, { sortBy, sortOrder }))
  }

  const handlePageChange = (page: number): void => {
    replaceQuery(buildClientSupplierMutationQuery(query, { page }))
  }

  const handlePageSizeChange = (pageSize: number): void => {
    replaceQuery({
      ...buildClientSupplierMutationQuery(query, { pageSize }),
      page: 1,
    })
  }

  const goToClients = useCallback((): void => {
    router.push('/clients')
  }, [router])

  const goToSuppliers = useCallback((): void => {
    router.push('/suppliers')
  }, [router])

  const confirmRecordDelete = async (): Promise<void> => {
    if (!recordPendingDelete?.id) {
      return
    }

    setIsDeleting(true)

    try {
      await apiRequest(`/api/${type}/${recordPendingDelete.id}`, {
        method: 'DELETE',
      })

      const shouldMoveBack = query.page > 1 && data?.items.length === 1
      const nextQuery = shouldMoveBack ? moveClientSupplierPageBack(query) : query
      const normalizedQuery =
        query.recordId === recordPendingDelete.id
          ? buildClientSupplierMutationQuery(nextQuery, { recordId: null })
          : nextQuery

      replaceQuery(normalizedQuery)
      setRecordPendingDelete(null)
      await revalidateScope()

      toastManager.add({
        type: 'success',
        title: type === 'clients' ? 'Cliente eliminado' : 'Proveedor eliminado',
        description: type === 'clients'
          ? 'El cliente se eliminó correctamente.'
          : 'El proveedor se eliminó correctamente.',
      })
    } catch (error: unknown) {
      toastManager.add({
        type: 'error',
        title: 'No se pudo eliminar',
        description: resolveClientSupplierManagementError(
          error,
          type === 'clients'
            ? 'No se pudo eliminar el cliente.'
            : 'No se pudo eliminar el proveedor.'
        ),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    isCreateModalOpen,
    isDeleting,
    recordId: query.recordId || null,
    viewRecordId,
    recordPendingDelete,
    query,
    searchValue,
    isTableLoading,
    data,
    recordDetail: query.recordId ? recordDetail : selectedRecordFromList,
    recordDetailError,
    isRecordDetailLoading: query.recordId ? isRecordDetailLoading : false,
    openCreateModal,
    handleCreateModalOpenChange,
    handleEditModalOpenChange,
    handleSelectRecord,
    handleCreateSuccess,
    handleEditSuccess,
    handleDeleteRecord,
    handleDeleteDialogOpenChange,
    handleRecordDetailError,
    handleSearchChange,
    handleClearFilters,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    confirmRecordDelete,
    goToClients,
    goToSuppliers,
  }
}
