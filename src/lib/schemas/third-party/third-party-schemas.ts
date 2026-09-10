import { z } from 'zod'
import { cuitSchema } from 'src/lib/schemas/voucher/voucher-schemas'
import {
  thirdPartyPageSizeOptions,
  thirdPartyQueryDefaults,
  thirdPartySortByOptions,
  thirdPartySortOrderOptions,
} from 'src/lib/constants/third-party'
import { inputLimits } from 'src/lib/constants/input-limits'

export const clientSupplierSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(inputLimits.maxNameLength, 'El nombre no puede superar los 255 caracteres'),
  cuit: cuitSchema,
}).strict()

export const clientSupplierListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine((value) => thirdPartyPageSizeOptions.includes(value as typeof thirdPartyPageSizeOptions[number])).default(thirdPartyQueryDefaults.pageSize),
  search: z.string().trim().max(inputLimits.maxSearchLength, 'La búsqueda no puede superar los 255 caracteres').optional(),
  sortBy: z.enum(thirdPartySortByOptions).default(thirdPartyQueryDefaults.sortBy),
  sortOrder: z.enum(thirdPartySortOrderOptions).default(thirdPartyQueryDefaults.sortOrder),
})
