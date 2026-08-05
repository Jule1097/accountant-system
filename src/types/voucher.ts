import { Prisma } from 'src/generated/prisma/client'

export interface VoucherRetention {
  retentionConceptId: string
  amount: Prisma.Decimal | number
  province?: string | null
}

export interface VoucherVatDetail {
  vatRateId: string
  subtotal: Prisma.Decimal | number
  vatAmount: Prisma.Decimal | number
}

export interface VoucherFilterParams {
  type?: string
  [key: string]: unknown
}
