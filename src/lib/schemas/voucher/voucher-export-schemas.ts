import { z } from 'zod'
import { inputLimits } from 'src/lib/constants/input-limits'
import { optionalCanonicalDateSchema } from 'src/lib/schemas/platform/date-schemas'

export const voucherExportQuerySchema = z.object({
  mode: z.enum(['filters', 'declaration']),
  type: z.enum(['sale', 'purchase']),
  search: z.string().trim().max(inputLimits.maxSearchLength, 'La búsqueda no puede superar los 255 caracteres').nullable().optional(),
  status: z.enum(['pending', 'partial', 'paid']).nullable().optional(),
  dateFrom: optionalCanonicalDateSchema('La fecha desde debe ser valida y no estar vacia.'),
  dateTo: optionalCanonicalDateSchema('La fecha hasta debe ser valida y no estar vacia.'),
  sortBy: z.enum(['date', 'status', 'voucher']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
