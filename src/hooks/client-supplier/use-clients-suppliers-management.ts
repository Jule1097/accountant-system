"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useToastManager } from 'src/components/ui/toast'
import { useCompany } from 'src/contexts/company-context'
import { useClientSupplierById, useClientsSuppliers } from 'src/hooks/client-supplier/use-clients-suppliers'
import { apiRequest } from 'src/lib/api/api-client'
import { replaceUrlState } from 'src/lib/helpers/platform/history-navigation'
import {
  buildClientSupplierMutationQuery,
  buildClientSupplierQuery,
  moveClientSupplierPageBack,
  readClientSupplierListQuery,
  resetClientSupplierPage,
  resolveClientSupplierManagementError,
} from 'src/lib/helpers/client-supplier/client-supplier-management'
import {
  ClientSupplierEntityType,
  ClientSupplierListQueryState,
  ClientSupplierRecord,
  ClientSupplierSortBy,
  ClientSupplierSortOrder,
  UseClientsSuppliersManagementResult,
} from 'src/types/client-supplier/client-supplier'

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
  const [viewRecordState, setViewRecordState] = useState<{ id: string | null; companyId: string | null }>({
    id: null,
    companyId: null,
  })
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const toastManager = useToastManager()
  const { activeCompanyId } = useCompany()
  const currentQueryString = useMemo(() => searchParams.toString(), [searchParams])
  const query = useMemo(() => readClientSupplierListQuery(searchParams), [searchParams])
  const [companyScopeId, setCompanyScopeId] = useState(activeCompanyId)
  const isCompanyChanging = companyScopeId !== activeCompanyId
  const activeQuery = isCompanyChanging ? emptyQueryState : query
  const emptyQueryString = useMemo(() => buildClientSupplierQuery(new URLSearchParams(), emptyQueryState), [])
  const viewRecordId = viewRecordState.companyId === activeCompanyId ? viewRecordState.id : null
  const querySearchValue = activeQuery.search || ''
  const [searchState, setSearchState] = useState({
    sourceQuery: querySearchValue,
    value: querySearchValue,
  })
  const searchSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchValue = searchState.sourceQuery === querySearchValue ? searchState.value : querySearchValue
  const listQuery = useMemo(() => ({
    ...activeQuery,
    recordId: null,
  }), [activeQuery])
  const { data, isLoading: isTableLoading, mutate } = useClientsSuppliers(type, listQuery)
  const {
    data: recordDetail,
    error: recordDetailError,
    isLoading: isRecordDetailLoading,
    mutate: mutateRecordDetail,
  } = useClientSupplierById(type, activeQuery.recordId || '')
  const selectedRecordFromList = useMemo(() => {
    if (!viewRecordId) {
      return undefined
    }

    return data?.items?.find((item) => item.id === viewRecordId)
  }, [data?.items, viewRecordId])

  const replaceQuery = useCallback((nextQuery: ClientSupplierListQueryState): void => {
    const nextUrl = `${pathname}${buildClientSupplierQuery(new URLSearchParams(currentQueryString), nextQuery)}`
    replaceUrlState(nextUrl)
  }, [currentQueryString, pathname])

  const syncCompanyScopeId = useCallback((nextCompanyId: string | null): void => {
    setCompanyScopeId(nextCompanyId)
  }, [])

  const setViewRecordId = useCallback((id: string | null): void => {
    setViewRecordState({
      id,
      companyId: activeCompanyId,
    })
  }, [activeCompanyId])

  useEffect(() => {
    if (isCompanyChanging) {
      return
    }

    if (searchValue === querySearchValue) {
      return
    }

    searchSyncTimeoutRef.current = setTimeout(() => {
      replaceQuery(
        resetClientSupplierPage(
          buildClientSupplierMutationQuery(activeQuery, {
            search: searchValue || undefined,
          })
        )
      )
    }, 1000)

    return () => {
      if (!searchSyncTimeoutRef.current) {
        return
      }

      clearTimeout(searchSyncTimeoutRef.current)
      searchSyncTimeoutRef.current = null
    }
  }, [activeQuery, isCompanyChanging, querySearchValue, replaceQuery, searchValue])

  useEffect(() => {
    if (!isCompanyChanging) {
      return
    }

    if (emptyQueryString !== `?${currentQueryString}` && currentQueryString !== '') {
      replaceQuery(emptyQueryState)
      return
    }

    const timeoutId = window.setTimeout(() => {
      syncCompanyScopeId(activeCompanyId)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [activeCompanyId, currentQueryString, emptyQueryString, isCompanyChanging, replaceQuery, syncCompanyScopeId])

  const revalidateScope = async (): Promise<void> => {
    await mutate()
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

    replaceQuery(buildClientSupplierMutationQuery(activeQuery, { recordId: null }))
    setViewRecordId(null)
  }

  const handleSelectRecord = (record: ClientSupplierRecord, action: 'view' | 'edit' = 'view'): void => {
    if (!record.id) {
      return
    }

    if (action === 'edit') {
      replaceQuery(buildClientSupplierMutationQuery(activeQuery, { recordId: record.id }))
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
    replaceQuery(buildClientSupplierMutationQuery(activeQuery, { recordId: null }))
    setViewRecordId(null)
  }

  const handleSearchChange = (value: string): void => {
    setSearchState({
      sourceQuery: querySearchValue,
      value,
    })
  }

  const handleClearFilters = (): void => {
    if (searchSyncTimeoutRef.current) {
      clearTimeout(searchSyncTimeoutRef.current)
      searchSyncTimeoutRef.current = null
    }

    setSearchState({
      sourceQuery: '',
      value: '',
    })
    replaceQuery({
      ...emptyQueryState,
      recordId: activeQuery.recordId,
    })
  }

  const handleSortChange = (sortBy: ClientSupplierSortBy, sortOrder: ClientSupplierSortOrder): void => {
    replaceQuery(buildClientSupplierMutationQuery(activeQuery, { sortBy, sortOrder }))
  }

  const handlePageChange = (page: number): void => {
    replaceQuery(buildClientSupplierMutationQuery(activeQuery, { page }))
  }

  const handlePageSizeChange = (pageSize: number): void => {
    replaceQuery({
      ...buildClientSupplierMutationQuery(activeQuery, { pageSize }),
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

      const shouldMoveBack = activeQuery.page > 1 && data?.items.length === 1
      const nextQuery = shouldMoveBack ? moveClientSupplierPageBack(activeQuery) : activeQuery
      const normalizedQuery =
        activeQuery.recordId === recordPendingDelete.id
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
    query: activeQuery,
    searchValue,
    isTableLoading,
    data,
    recordDetail: activeQuery.recordId ? recordDetail : selectedRecordFromList,
    recordDetailError,
    isRecordDetailLoading: activeQuery.recordId ? isRecordDetailLoading : false,
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
