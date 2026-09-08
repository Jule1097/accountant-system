"use client"

import dynamic from "next/dynamic"
import type { ClientSupplierOverlaysProps } from "src/types/third-party/third-party-resource"

const ClientSupplierDeleteDialog = dynamic(
  () => import("src/components/third-party/third-party-delete-dialog").then((module) => module.ClientSupplierDeleteDialog),
  { ssr: false, loading: () => null }
)

const ClientSupplierDetailModal = dynamic(
  () => import("src/components/third-party/third-party-modal").then((module) => module.ClientSupplierDetailModal),
  { ssr: false, loading: () => null }
)

const ClientSupplierModal = dynamic(
  () => import("src/components/third-party/third-party-modal").then((module) => module.ClientSupplierModal),
  { ssr: false, loading: () => null }
)

export function ClientSupplierManagementOverlays({
  type,
  isCreateModalOpen,
  isDeleting,
  recordId,
  viewRecordId,
  recordPendingDelete,
  recordDetail,
  recordDetailError,
  isRecordDetailLoading,
  onCreateModalOpenChange,
  onEditModalOpenChange,
  onCreateSuccess,
  onEditSuccess,
  onDeleteDialogOpenChange,
  onRecordDetailError,
  onConfirmDelete,
}: ClientSupplierOverlaysProps) {
  return (
    <>
      {isCreateModalOpen ?
        <ClientSupplierModal isOpen type={type} mode="create" onOpenChange={onCreateModalOpenChange} onSuccess={onCreateSuccess} /> : null}

      {recordId ?
        <ClientSupplierModal isOpen type={type} mode="edit" isLoading={isRecordDetailLoading} record={recordDetail} onOpenChange={onEditModalOpenChange} onSuccess={onEditSuccess} /> : null}

      {viewRecordId ?
        <ClientSupplierDetailModal isOpen type={type} record={recordDetail} error={recordDetailError} isLoading={isRecordDetailLoading} onOpenChange={onEditModalOpenChange} onLoadError={onRecordDetailError} /> : null}

      {recordPendingDelete ?
        <ClientSupplierDeleteDialog isOpen type={type} record={recordPendingDelete} isDeleting={isDeleting} onOpenChange={onDeleteDialogOpenChange} onConfirm={onConfirmDelete} /> : null}
    </>
  )
}
