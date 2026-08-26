"use client"

import { ClientSupplierDeleteDialog } from 'src/components/clients-suppliers/client-supplier-delete-dialog'
import {
  ClientSupplierDetailModal,
  ClientSupplierModal,
} from 'src/components/clients-suppliers/client-supplier-modal'
import { ClientSupplierSkeleton } from 'src/components/clients-suppliers/client-supplier-skeleton'
import { ClientSupplierTable } from 'src/components/clients-suppliers/client-supplier-table'
import { useClientsSuppliersManagement } from 'src/hooks/use-clients-suppliers-management'
import { ClientsSuppliersManagementViewProps } from 'src/types/client-supplier'

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
    isTableLoading,
    data,
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
  } = useClientsSuppliersManagement(type)

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex w-full gap-4 border-b border-border/40">
        <button
          type="button"
          data-active={type === 'clients'}
          className={`relative pb-2 text-sm font-medium transition-colors ${type === 'clients'
            ? 'text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]'
            : 'text-muted-foreground hover:text-foreground'
            }`}
          onClick={goToClients}
        >
          Clientes
        </button>
        <button
          type="button"
          data-active={type === 'suppliers'}
          className={`relative pb-2 text-sm font-medium transition-colors ${type === 'suppliers'
            ? 'text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]'
            : 'text-muted-foreground hover:text-foreground'
            }`}
          onClick={goToSuppliers}
        >
          Proveedores
        </button>
      </div>

      {isTableLoading || !data ? (
        <ClientSupplierSkeleton />
      ) : (
        <ClientSupplierTable
          data={data}
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
        />
      )}

      <ClientSupplierModal
        isOpen={isCreateModalOpen}
        type={type}
        mode="create"
        onOpenChange={handleCreateModalOpenChange}
        onSuccess={handleCreateSuccess}
      />

      <ClientSupplierModal
        isOpen={Boolean(recordId)}
        type={type}
        mode="edit"
        isLoading={isRecordDetailLoading}
        record={recordDetail}
        onOpenChange={handleEditModalOpenChange}
        onSuccess={handleEditSuccess}
      />

      <ClientSupplierDetailModal
        isOpen={Boolean(viewRecordId)}
        type={type}
        record={recordDetail}
        error={recordDetailError}
        isLoading={isRecordDetailLoading}
        onOpenChange={handleEditModalOpenChange}
        onLoadError={handleRecordDetailError}
      />

      <ClientSupplierDeleteDialog
        isOpen={Boolean(recordPendingDelete)}
        type={type}
        record={recordPendingDelete}
        isDeleting={isDeleting}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={confirmRecordDelete}
      />
    </div>
  )
}
