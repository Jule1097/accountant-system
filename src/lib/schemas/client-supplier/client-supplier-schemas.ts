import { z } from 'zod'
import { cuitSchema } from 'src/lib/schemas/voucher/voucher-schemas'

const clientSupplierListPageSizes = [10, 20, 50] as const

export const clientSupplierSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  cuit: cuitSchema,
})

export const clientSupplierListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine((value) => clientSupplierListPageSizes.includes(value as 10 | 20 | 50)).default(10),
  search: z.string().trim().optional(),
  sortBy: z.enum(['name', 'cuit']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})
