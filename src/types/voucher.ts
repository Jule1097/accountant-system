import { Prisma } from 'src/generated/prisma/client'
import { Voucher } from 'src/models/Voucher'

export interface VoucherRetention {
  retentionConceptId: string
  amount: Prisma.Decimal | number
  province?: string | null
  retentionConcept?: {
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
  type?: string
  [key: string]: unknown
}

export interface UseVouchersResult {
  promise: Promise<Voucher[]> | null
}

export interface UseVoucherByIdResult {
  promise: Promise<Voucher> | null
}

