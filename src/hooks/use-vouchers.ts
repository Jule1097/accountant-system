"use client"

import useSWR from 'swr'
import { useCompany } from 'src/contexts/company-context'
import {
  buildVoucherCollectionPath,
  buildVoucherDetailPath,
  buildVoucherSummaryPath,
} from 'src/lib/helpers/voucher-management'
import { buildCompanyPathKey, companyPathFetcher } from 'src/lib/helpers/swr'
import { Voucher } from 'src/models/Voucher'
import {
  UseVoucherByIdResult,
  UseVouchersResult,
  UseVoucherSummaryResult,
  VoucherListQueryState,
  VoucherListResponse,
  VoucherRecordType,
  VoucherSummaryResponse,
} from 'src/types/voucher'

function mapVoucherListResponse(response: VoucherListResponse): VoucherListResponse {
  return {
    ...response,
    items: response.items.map((item) => ({
      ...item,
      voucher: new Voucher(item.voucher),
    })),
  }
}

export function useVouchers(type: VoucherRecordType, query: VoucherListQueryState): UseVouchersResult {
  const { activeCompanyId } = useCompany()
  const key = buildCompanyPathKey(activeCompanyId, buildVoucherCollectionPath(type, query))
  const { data, isLoading, mutate } = useSWR(
    key,
    ([companyId, path]) => companyPathFetcher<VoucherListResponse>(companyId, path).then(mapVoucherListResponse),
    {
      keepPreviousData: true,
    }
  )

  return {
    data,
    isLoading,
    mutate,
  }
}

export function useVoucherSummary(type: VoucherRecordType, query: VoucherListQueryState): UseVoucherSummaryResult {
  const { activeCompanyId } = useCompany()
  const key = buildCompanyPathKey(activeCompanyId, buildVoucherSummaryPath(type, query))
  const { data, isLoading, mutate } = useSWR(
    key,
    ([companyId, path]) => companyPathFetcher<VoucherSummaryResponse>(companyId, path)
  )

  return {
    data,
    isLoading,
    mutate,
  }
}

export function useVoucherById(id: string): UseVoucherByIdResult {
  const { activeCompanyId } = useCompany()
  const path = id ? buildVoucherDetailPath(id) : null
  const key = buildCompanyPathKey(activeCompanyId, path)
  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([companyId, requestPath]) => companyPathFetcher<unknown>(companyId, requestPath).then((response) => new Voucher(response)),
    {
      keepPreviousData: true,
    }
  )

  return {
    data,
    isLoading,
    error,
    mutate,
  }
}
