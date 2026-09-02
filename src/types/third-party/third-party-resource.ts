import { Client, Supplier, Prisma } from 'src/generated/prisma/client'

export type ClientSupplierEntityType = 'clients' | 'suppliers'

export type ClientSupplierSortBy = 'name' | 'cuit'

export type ClientSupplierSortOrder = 'asc' | 'desc'

export type ClientSupplierModalMode = 'create' | 'edit' | 'view'

export type ClientSupplierRecord = Client | Supplier

export interface ClientSupplierFormValues {
  name: string
  cuit: string
}

export interface ClientSupplierModalInitialValues {
  name?: string
  cuit?: string
}

export type ClientSupplierWhereInput = Prisma.ClientWhereInput & Prisma.SupplierWhereInput

export type ClientSupplierOrderByInput = Prisma.ClientOrderByWithRelationInput & Prisma.SupplierOrderByWithRelationInput

export interface ClientSupplierFilterParams {
  search?: string
  sortBy?: ClientSupplierSortBy
  sortOrder?: ClientSupplierSortOrder
  filters?: Record<string, string>
}

export interface ClientSupplierListResponse<TItem> {
  items: TItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ClientListResponse = ClientSupplierListResponse<Client>

export type SupplierListResponse = ClientSupplierListResponse<Supplier>

export interface ClientSupplierListQueryState {
  page: number
  pageSize: number
  search?: string
  sortBy?: ClientSupplierSortBy
  sortOrder?: ClientSupplierSortOrder
  recordId?: string | null
}

export interface UseClientsSuppliersManagementResult {
  isCreateModalOpen: boolean
  isDeleting: boolean
  recordId: string | null
  viewRecordId: string | null
  recordPendingDelete: ClientSupplierRecord | null
  query: ClientSupplierListQueryState
  searchValue: string
  isTableLoading: boolean
  data: ClientSupplierListResponse<ClientSupplierRecord> | undefined
  recordDetail: ClientSupplierRecord | undefined
  recordDetailError: unknown
  isRecordDetailLoading: boolean
  openCreateModal: () => void
  handleCreateModalOpenChange: (open: boolean) => void
  handleEditModalOpenChange: (open: boolean) => void
  handleSelectRecord: (record: ClientSupplierRecord, action?: 'view' | 'edit') => void
  handleCreateSuccess: () => Promise<void>
  handleEditSuccess: () => Promise<void>
  handleDeleteRecord: (record: ClientSupplierRecord) => void
  handleDeleteDialogOpenChange: (open: boolean) => void
  handleRecordDetailError: (error: unknown) => void
  handleSearchChange: (value: string) => void
  handleClearFilters: () => void
  handleSortChange: (sortBy: ClientSupplierSortBy, sortOrder: ClientSupplierSortOrder) => void
  handlePageChange: (page: number) => void
  handlePageSizeChange: (pageSize: number) => void
  confirmRecordDelete: () => Promise<void>
  goToClients: () => void
  goToSuppliers: () => void
}

export interface ClientsSuppliersManagementViewProps {
  type: ClientSupplierEntityType
  title: string
  description: string
}

export interface ClientSupplierTableProps {
  data?: ClientSupplierListResponse<ClientSupplierRecord>
  isLoading: boolean
  query: ClientSupplierListQueryState
  searchValue: string
  type: ClientSupplierEntityType
  onAdd: () => void
  onSelectRecord: (record: ClientSupplierRecord, action?: 'view' | 'edit') => void
  onDeleteRecord: (record: ClientSupplierRecord) => void
  onSearchChange: (value: string) => void
  onClearFilters: () => void
  onSortChange: (sortBy: ClientSupplierSortBy, sortOrder: ClientSupplierSortOrder) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export interface ClientSupplierModalProps {
  isOpen: boolean
  type: ClientSupplierEntityType
  mode: Exclude<ClientSupplierModalMode, 'view'>
  isLoading?: boolean
  record?: ClientSupplierRecord | null
  initialValues?: ClientSupplierModalInitialValues
  onOpenChange: (open: boolean) => void
  onSuccess?: (record?: ClientSupplierRecord) => Promise<void> | void
  onResolveDuplicate?: (values: ClientSupplierFormValues) => Promise<ClientSupplierRecord | null>
}

export interface ClientSupplierDetailModalProps {
  isOpen: boolean
  type: ClientSupplierEntityType
  record?: ClientSupplierRecord
  isLoading?: boolean
  error?: unknown
  onOpenChange: (open: boolean) => void
  onLoadError: (error: unknown) => void
}

export interface ClientSupplierDeleteDialogProps {
  isOpen: boolean
  type: ClientSupplierEntityType
  record: ClientSupplierRecord | null
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}
