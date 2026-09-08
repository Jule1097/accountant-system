"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useToastManager } from 'src/components/ui/toast'
import { thirdPartyEntityTypes, thirdPartyQueryDefaults, thirdPartyQueryParams, thirdPartyRecordActions, thirdPartyRoutes } from 'src/lib/constants/third-party'
import { useCompany } from 'src/contexts/company-context'
import { useClientSupplierById, useClientsSuppliers } from 'src/hooks/third-party/use-third-parties'
import { useResourceMutation } from 'src/hooks/shared/use-resource'
import { useTableQueryState } from 'src/hooks/shared/use-table-query-state'
import { useResourceDeletionCoordinator } from 'src/hooks/shared/use-resource-deletion'
import { resolveResourceDeletionQuery } from 'src/lib/helpers/shared/resource-deletion'
import { createClientSupplierMutationAdapter } from 'src/lib/helpers/third-party/third-party-resource-adapter'
import {
  buildClientSupplierMutationQuery,
  buildClientSupplierQuery,
  clientSupplierTableParameters,
  moveClientSupplierPageBack,
  readClientSupplierListQuery,
  resolveClientSupplierManagementError,
} from 'src/lib/helpers/third-party/third-party-management'
import {
  buildClientSupplierDetailErrorFeedback,
  buildClientSupplierDeleteErrorFeedback,
  buildClientSupplierDeleteSuccessFeedback,
} from 'src/lib/helpers/third-party/third-party-ui'
import {
  ClientSupplierEntityType,
  ClientSupplierListQueryState,
  ClientSupplierRecord,
  ClientSupplierSortBy,
  ClientSupplierSortOrder,
  UseClientsSuppliersManagementResult,
} from 'src/types/third-party/third-party-resource'

const emptyQueryState: ClientSupplierListQueryState = {
  page: thirdPartyQueryDefaults.page,
  pageSize: thirdPartyQueryDefaults.pageSize,
  sortBy: thirdPartyQueryDefaults.sortBy,
  sortOrder: thirdPartyQueryDefaults.sortOrder,
  recordId: null,
}

export function useClientsSuppliersManagement(type: ClientSupplierEntityType): UseClientsSuppliersManagementResult {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [recordPendingDelete, setRecordPendingDelete] = useState<ClientSupplierRecord | null>(null)
  const [viewRecordState, setViewRecordState] = useState<{ id: string | null; companyId: string | null }>({
    id: null,
    companyId: null,
  })
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const toastManager = useToastManager()
  const { activeCompanyId } = useCompany()
  const { remove: deleteResource, isMutating: isDeleting } = useResourceMutation({
    adapter: createClientSupplierMutationAdapter(type),
    scopeId: activeCompanyId,
  })
  const query = useMemo(() => readClientSupplierListQuery(searchParams), [searchParams])
  const [companyScopeId, setCompanyScopeId] = useState(activeCompanyId)
  const isCompanyChanging = companyScopeId !== activeCompanyId
  const activeQuery = isCompanyChanging ? emptyQueryState : query
  const emptyQueryString = useMemo(() => buildClientSupplierQuery(new URLSearchParams(), emptyQueryState), [])
  const viewRecordId = viewRecordState.companyId === activeCompanyId ? viewRecordState.id : null
  const listQuery = useMemo(() => ({
    ...activeQuery,
    recordId: null,
  }), [activeQuery])
  const { data, error: tableError, isLoading: isTableLoading, mutate } = useClientsSuppliers(type, listQuery)
  const tableQueryState = useTableQueryState({ pathname, parameters: clientSupplierTableParameters, pageKey: thirdPartyQueryParams.page, searchKey: thirdPartyQueryParams.search, totalPages: data?.totalPages })
  const managementQuery = isCompanyChanging ? emptyQueryState : tableQueryState.query
  const {
    data: recordDetail,
    error: recordDetailError,
    isLoading: isRecordDetailLoading,
    mutate: mutateRecordDetail,
  } = useClientSupplierById(type, managementQuery.recordId || '')
  const selectedRecordFromList = useMemo(() => {
    if (!viewRecordId) {
      return undefined
    }

    return data?.items?.find((item) => item.id === viewRecordId)
  }, [data?.items, viewRecordId])

  const replaceQuery = useCallback((nextQuery: ClientSupplierListQueryState): void => tableQueryState.update(nextQuery), [tableQueryState])
  const { searchValue, setSearch, cancelSearch } = tableQueryState

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
    if (!isCompanyChanging) {
      return
    }

    if (emptyQueryString !== `?${searchParams.toString()}` && searchParams.toString() !== '') {
      replaceQuery({ ...emptyQueryState, search: '' })
      return
    }

    const timeoutId = window.setTimeout(() => {
      syncCompanyScopeId(activeCompanyId)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [activeCompanyId, emptyQueryString, isCompanyChanging, replaceQuery, searchParams, syncCompanyScopeId])

  const revalidateScope = async (): Promise<void> => {
    await mutate()
  }

  const resolveNextDeleteQuery = useCallback((): ClientSupplierListQueryState => {
    const shouldMoveBack = managementQuery.page > 1 && data?.items.length === 1
    const nextQuery = resolveResourceDeletionQuery(managementQuery, shouldMoveBack, moveClientSupplierPageBack)

    return managementQuery.recordId === recordPendingDelete?.id
      ? buildClientSupplierMutationQuery(nextQuery, { recordId: null })
      : nextQuery
  }, [managementQuery, data?.items.length, recordPendingDelete?.id])

  const deletion = useResourceDeletionCoordinator({
    pendingRecord: recordPendingDelete,
    getResourceId: (record) => record.id || null,
    deleteResource,
    isDeleting,
    resolveNextQuery: resolveNextDeleteQuery,
    updateQuery: replaceQuery,
    clearPendingRecord: () => setRecordPendingDelete(null),
    refreshList: revalidateScope,
  })

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

    replaceQuery(buildClientSupplierMutationQuery(managementQuery, { recordId: null }))
    setViewRecordId(null)
  }

  const handleSelectRecord = (record: ClientSupplierRecord, action: 'view' | 'edit' = thirdPartyRecordActions.view): void => {
    if (!record.id) {
      return
    }

    if (action === thirdPartyRecordActions.edit) {
      replaceQuery(buildClientSupplierMutationQuery(managementQuery, { recordId: record.id }))
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
    toastManager.add(buildClientSupplierDetailErrorFeedback(
      type,
      resolveClientSupplierManagementError(
        error,
        type === thirdPartyEntityTypes.clients
          ? 'No se pudo cargar el cliente seleccionado.'
          : 'No se pudo cargar el proveedor seleccionado.'
      )
    ))
    replaceQuery(buildClientSupplierMutationQuery(managementQuery, { recordId: null }))
    setViewRecordId(null)
  }

  const handleSearchChange = (value: string): void => {
    setSearch(value)
  }

  const handleClearFilters = (): void => {
    cancelSearch()
    setSearch('')
    replaceQuery({
      ...emptyQueryState,
      search: '',
      recordId: managementQuery.recordId,
    })
  }

  const handleSortChange = (sortBy: ClientSupplierSortBy, sortOrder: ClientSupplierSortOrder): void => {
    replaceQuery(buildClientSupplierMutationQuery(managementQuery, { sortBy, sortOrder }))
  }

  const handlePageChange = (page: number): void => {
    replaceQuery(buildClientSupplierMutationQuery(managementQuery, { page }))
  }

  const handlePageSizeChange = (pageSize: number): void => {
    replaceQuery({
      ...buildClientSupplierMutationQuery(managementQuery, { pageSize }),
      page: 1,
    })
  }

  const goToClients = useCallback((): void => {
    router.push(thirdPartyRoutes.clients)
  }, [router])

  const goToSuppliers = useCallback((): void => {
    router.push(thirdPartyRoutes.suppliers)
  }, [router])

  const confirmRecordDelete = async (): Promise<void> => {
    try {
      await deletion.confirmDelete()
      toastManager.add(buildClientSupplierDeleteSuccessFeedback(type))
    } catch (error: unknown) {
      toastManager.add(buildClientSupplierDeleteErrorFeedback(
        type,
        resolveClientSupplierManagementError(
          error,
          type === thirdPartyEntityTypes.clients
            ? 'No se pudo eliminar el cliente.'
            : 'No se pudo eliminar el proveedor.'
        )
      ))
    }
  }

  return {
    isCreateModalOpen,
    isDeleting,
    recordId: managementQuery.recordId || null,
    viewRecordId,
    recordPendingDelete,
    query: managementQuery,
    searchValue,
    isTableLoading,
    tableError,
    data,
    recordDetail: managementQuery.recordId ? recordDetail : selectedRecordFromList,
    recordDetailError,
    isRecordDetailLoading: managementQuery.recordId ? isRecordDetailLoading : false,
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
    retryTable: revalidateScope,
    goToClients,
    goToSuppliers,
  }
}
