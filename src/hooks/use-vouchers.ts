"use client"

import { useMemo } from 'react'
import { useCompany } from 'src/contexts/company-context'
import { apiRequest } from 'src/lib/api-client'
import { Voucher } from 'src/models/Voucher'
import { UseVouchersResult, UseVoucherByIdResult } from 'src/types/voucher'

export function useVouchers(type?: string): UseVouchersResult {
  const { activeCompanyId } = useCompany()

  const promise = useMemo(() => {
    if (!activeCompanyId) {
      return null
    }
    return apiRequest(`/api/vouchers${type ? `?type=${type}` : ''}`)
      .then((res) => res.json())
      .then((data: unknown[]) => data.map((d) => new Voucher(d)))
  }, [activeCompanyId, type])

  return {
    promise
  }
}

export function useVoucherById(id: string): UseVoucherByIdResult {
  const { activeCompanyId } = useCompany()

  const promise = useMemo(() => {
    if (!activeCompanyId || !id) {
      return null
    }
    return apiRequest(`/api/vouchers/${id}`)
      .then((res) => res.json())
      .then((data: unknown) => new Voucher(data))
  }, [activeCompanyId, id])

  return {
    promise
  }
}

