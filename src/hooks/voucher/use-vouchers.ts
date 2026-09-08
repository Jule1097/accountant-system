"use client"

import { useResourceDetail, useResourceList } from 'src/hooks/shared/use-resource'
import { createVoucherDetailAdapter, createVoucherListAdapter, createVoucherSummaryAdapter } from 'src/lib/helpers/voucher/voucher-resource-adapter'
import type { UseVoucherByIdResult, UseVouchersResult, UseVoucherSummaryResult, VoucherListQueryState, VoucherRecordType } from 'src/types/voucher/voucher'

export function useVouchers(type: VoucherRecordType, query: VoucherListQueryState): UseVouchersResult {
  const { data, isLoading, mutate } = useResourceList({ query, adapter: createVoucherListAdapter(type) })

  return {
    data,
    isLoading,
    mutate,
  }
}

export function useVoucherSummary(type: VoucherRecordType, query: VoucherListQueryState): UseVoucherSummaryResult {
  const { data, isLoading, mutate } = useResourceList({ query, adapter: createVoucherSummaryAdapter(type) })

  return {
    data,
    isLoading,
    mutate,
  }
}

export function useVoucherById(id: string): UseVoucherByIdResult {
  const { data, error, isLoading, mutate } = useResourceDetail({ resourceId: id || null, adapter: createVoucherDetailAdapter(), swrOptions: { keepPreviousData: true } })

  return {
    data,
    isLoading,
    error,
    mutate,
  }
}
