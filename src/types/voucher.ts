import { Prisma } from 'src/generated/prisma/client'
import { useVouchers, useVoucherSummary } from 'src/hooks/use-vouchers'
import { Voucher } from 'src/models/Voucher'

export type VoucherRecordType = 'sale' | 'purchase'

export type VoucherStatus = 'pending' | 'partial' | 'paid'

export type VoucherSortBy = 'date' | 'status' | 'voucher'

export type VoucherSortOrder = 'asc' | 'desc'

export interface VoucherRetention {
  retentionConceptId: string
  taxJurisdictionId?: string | null
  amount: Prisma.Decimal | number
  retentionConcept?: {
    id: string
    name: string
    type?: string
  } | null
  taxJurisdiction?: {
    id: string
    name: string
  } | null
}

export interface VoucherPerception {
  perceptionConceptId: string
  taxJurisdictionId?: string | null
  amount: Prisma.Decimal | number
  perceptionConcept?: {
    id: string
    name: string
  } | null
  taxJurisdiction?: {
    id: string
    name: string
  } | null
}

export interface VoucherVatDetail {
  vatRateId: string
  subtotal: Prisma.Decimal | number
  vatAmount: Prisma.Decimal | number
  vatRate?: {
    id: string
    name: string
  } | null
}

export interface VoucherFilterParams {
  type?: VoucherRecordType
  search?: string
  status?: VoucherStatus
  dateFrom?: Date
  dateTo?: Date
  sortBy?: VoucherSortBy
  sortOrder?: VoucherSortOrder
}

export interface VoucherListQueryState {
  page: number
  pageSize: number
  search?: string
  status?: VoucherStatus
  dateFrom?: string
  dateTo?: string
  sortBy?: VoucherSortBy
  sortOrder?: VoucherSortOrder
  voucherId?: string | null
}

export interface VoucherListItem {
  voucher: Voucher
  composedVoucherId: string
  partyName: string | null
  partyCuit: string | null
}

export interface VoucherListResponse {
  items: VoucherListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface VoucherSummaryResponse {
  totalCount: number
  totalAmount: number
  topPartyName: string | null
}

export interface VoucherCollectionKey {
  type: VoucherRecordType
  query: VoucherListQueryState
}

export type VoucherScreenType = 'sales' | 'purchases'

export type VoucherModalMode = 'create' | 'edit'

export interface UseVouchersResult {
  data: VoucherListResponse | undefined
  isLoading: boolean
  mutate: () => Promise<VoucherListResponse | undefined>
}

export interface UseVoucherByIdResult {
  data: Voucher | undefined
  isLoading: boolean
  error: unknown
  mutate: () => Promise<Voucher | undefined>
}

export interface UseVoucherSummaryResult {
  data: VoucherSummaryResponse | undefined
  isLoading: boolean
  mutate: () => Promise<VoucherSummaryResponse | undefined>
}

export interface UseVoucherManagementResult {
  isCreateModalOpen: boolean;
  isDeleting: boolean;
  voucherId: string | null;
  voucherPendingDelete: Voucher | null;
  query: VoucherListQueryState;
  searchValue: string;
  isTableLoading: boolean;
  isSummaryLoading: boolean;
  vouchersData: ReturnType<typeof useVouchers>["data"];
  summaryData: ReturnType<typeof useVoucherSummary>["data"];
  voucherDetail: Voucher | undefined;
  voucherDetailError: unknown;
  isVoucherDetailLoading: boolean;
  openCreateModal: () => void;
  handleCreateModalOpenChange: (open: boolean) => void;
  handleEditModalOpenChange: (open: boolean) => void;
  handleSelectVoucher: (voucher: Voucher) => void;
  handleCreateSuccess: () => Promise<void>;
  handleEditSuccess: (_voucher: Voucher, mode: VoucherModalMode) => Promise<void>;
  handleDeleteVoucher: (voucher: Voucher) => void;
  handleDeleteDialogOpenChange: (open: boolean) => void;
  handleVoucherDetailError: (error: unknown) => void;
  handleSearchChange: (value: string) => void;
  handleClearFilters: () => void;
  handleStatusChange: (value: VoucherListQueryState["status"]) => void;
  handleDateRangeChange: (dateFrom: string, dateTo: string) => void;
  handleSortChange: (sortBy: VoucherListQueryState["sortBy"], sortOrder: VoucherListQueryState["sortOrder"]) => void;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
  confirmVoucherDelete: () => Promise<void>;
}
