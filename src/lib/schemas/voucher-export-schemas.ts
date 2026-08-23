import { z } from 'zod'

export const voucherExportQuerySchema = z.object({
  mode: z.enum(['filters', 'declaration']),
  type: z.enum(['sale', 'purchase']),
  search: z.string().trim().nullable().optional(),
  status: z.enum(['pending', 'partial', 'paid']).nullable().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['date', 'status', 'voucher']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
