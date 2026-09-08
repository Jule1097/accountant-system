"use client"

import { ClientSupplierTable } from 'src/components/third-party/third-party-table'
import { ClientSupplierManagementHeader } from 'src/components/third-party/third-party-management-header'
import { ClientSupplierManagementOverlays } from 'src/components/third-party/third-party-management-overlays'
import { ClientSupplierSkeleton } from 'src/components/third-party/third-party-skeleton'
import { useClientsSuppliersManagement } from 'src/hooks/third-party/use-third-party-management'
import { ClientsSuppliersManagementViewProps } from 'src/types/third-party/third-party-resource'

export function ClientsSuppliersManagementView({
  type,
  title,
  description,
}: ClientsSuppliersManagementViewProps) {
  const {
    isCreateModalOpen,
    isDeleting,
    recordId,
    viewRecordId,
    recordPendingDelete,
    query,
    searchValue,
    data,
    isTableLoading,
    tableError,
    recordDetail,
    recordDetailError,
    isRecordDetailLoading,
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
    retryTable,
  } = useClientsSuppliersManagement(type)
  const isTablePending = isTableLoading || !data

  return (
    <div className="flex-1 space-y-6">
      <ClientSupplierManagementHeader type={type} title={title} description={description} onClientsClick={goToClients} onSuppliersClick={goToSuppliers} />

      {isTablePending ? <ClientSupplierSkeleton /> : <ClientSupplierTable
        data={data}
        isLoading={false}
        error={tableError}
        query={query}
        searchValue={searchValue}
        type={type}
        onAdd={openCreateModal}
        onSelectRecord={handleSelectRecord}
        onDeleteRecord={handleDeleteRecord}
        onSearchChange={handleSearchChange}
        onClearFilters={handleClearFilters}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRetry={retryTable}
      />}
      <ClientSupplierManagementOverlays
        type={type}
        isCreateModalOpen={isCreateModalOpen}
        isDeleting={isDeleting}
        recordId={recordId}
        viewRecordId={viewRecordId}
        recordPendingDelete={recordPendingDelete}
        recordDetail={recordDetail}
        recordDetailError={recordDetailError}
        isRecordDetailLoading={isRecordDetailLoading}
        onCreateModalOpenChange={handleCreateModalOpenChange}
        onEditModalOpenChange={handleEditModalOpenChange}
        onCreateSuccess={handleCreateSuccess}
        onEditSuccess={handleEditSuccess}
        onDeleteDialogOpenChange={handleDeleteDialogOpenChange}
        onRecordDetailError={handleRecordDetailError}
        onConfirmDelete={confirmRecordDelete}
      />
    </div>
  )
}
