"use client"

import { useMemo } from 'react'
import { useCompany } from 'src/contexts/company-context'
import { apiRequest } from 'src/lib/api-client'
import { Voucher } from 'src/models/Voucher'
import { UseVouchersResult, UseVoucherByIdResult } from 'src/types/voucher'

function buildVoucherCollectionPath(type?: string, refreshKey?: number): string {
  const searchParams = new URLSearchParams()

  if (type) {
    searchParams.set('type', type)
  }

  if (typeof refreshKey === 'number' && refreshKey > 0) {
    searchParams.set('refreshKey', refreshKey.toString())
  }

  const query = searchParams.toString()

  if (!query) {
    return '/api/vouchers'
  }

  return `/api/vouchers?${query}`
}

function buildVoucherDetailPath(id: string, refreshKey?: number): string {
  if (typeof refreshKey !== 'number' || refreshKey <= 0) {
    return `/api/vouchers/${id}`
  }

  return `/api/vouchers/${id}?refreshKey=${refreshKey}`
}

export function useVouchers(type?: string, refreshKey = 0): UseVouchersResult {
  const { activeCompanyId } = useCompany()

  const promise = useMemo(() => {
    if (!activeCompanyId) {
      return null
    }

    return apiRequest(buildVoucherCollectionPath(type, refreshKey))
      .then((res) => res.json())
      .then((data: unknown[]) => data.map((d) => new Voucher(d)))
  }, [activeCompanyId, refreshKey, type])

  return {
    promise
  }
}

export function useVoucherById(id: string, refreshKey = 0): UseVoucherByIdResult {
  const { activeCompanyId } = useCompany()

  const promise = useMemo(() => {
    if (!activeCompanyId || !id) {
      return null
    }

    return apiRequest(buildVoucherDetailPath(id, refreshKey))
      .then((res) => res.json())
      .then((data: unknown) => new Voucher(data))
  }, [activeCompanyId, id, refreshKey])

  return {
    promise
  }
}
