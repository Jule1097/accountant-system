import { z } from 'zod'
import { inputLimits } from 'src/lib/constants/input-limits'

export const voucherExportQuerySchema = z.object({
  mode: z.enum(['filters', 'declaration']),
  type: z.enum(['sale', 'purchase']),
  search: z.string().trim().max(inputLimits.maxSearchLength, 'La búsqueda no puede superar los 255 caracteres').nullable().optional(),
  status: z.enum(['pending', 'partial', 'paid']).nullable().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['date', 'status', 'voucher']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
