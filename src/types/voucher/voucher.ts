import type { VoucherApiResponse } from 'src/types/voucher/voucher-api'
import { useVouchers, useVoucherSummary } from 'src/hooks/voucher/use-vouchers'

export type VoucherRecordType = 'sale' | 'purchase'

export type VoucherStatus = 'pending' | 'partial' | 'paid'

export type VoucherSortBy = 'date' | 'status' | 'voucher'

export type VoucherSortOrder = 'asc' | 'desc'

export interface VoucherVatDetail {
  vatRateId: string
  subtotal: string | number
  vatAmount: string | number
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

export interface VoucherListItem<TVoucher = VoucherApiResponse> {
  rowKey: string
  voucher: TVoucher
  composedVoucherId: string
  partyName: string | null
  partyCuit: string | null
}

export interface VoucherListResponse<TVoucher = VoucherApiResponse> {
  items: VoucherListItem<TVoucher>[]
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

export type VoucherScreenType = 'sales' | 'purchases'

export type VoucherModalMode = 'create' | 'edit' | 'view'

export interface UseVouchersResult {
  data: VoucherListResponse<VoucherApiResponse> | undefined
  isLoading: boolean
  mutate: () => Promise<VoucherListResponse<VoucherApiResponse> | undefined>
}

export interface UseVoucherByIdResult {
  data: VoucherApiResponse | undefined
  isLoading: boolean
  error: unknown
  mutate: () => Promise<VoucherApiResponse | undefined>
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
  viewVoucherId: string | null;
  setViewVoucherId: (id: string | null) => void;
  voucherPendingDelete: VoucherApiResponse | null;
  query: VoucherListQueryState;
  searchValue: string;
  isTableLoading: boolean;
  isSummaryLoading: boolean;
  vouchersData: ReturnType<typeof useVouchers>["data"];
  summaryData: ReturnType<typeof useVoucherSummary>["data"];
  voucherDetail: VoucherApiResponse | undefined;
  voucherDetailError: unknown;
  isVoucherDetailLoading: boolean;
  openCreateModal: () => void;
  handleCreateModalOpenChange: (open: boolean) => void;
  handleEditModalOpenChange: (open: boolean) => void;
  handleSelectVoucher: (voucher: VoucherApiResponse, action?: "view" | "edit") => void;
  handleCreateSuccess: () => Promise<void>;
  handleEditSuccess: (_voucher: VoucherApiResponse, mode: VoucherModalMode) => Promise<void>;
  handleDeleteVoucher: (voucher: VoucherApiResponse) => void;
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
