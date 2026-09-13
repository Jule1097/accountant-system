import { z } from 'zod'
import { cuitSchema } from 'src/lib/schemas/voucher/voucher-schemas'
import {
  thirdPartyPageSizeOptions,
  thirdPartyQueryDefaults,
  thirdPartySortByOptions,
  thirdPartySortOrderOptions,
} from 'src/lib/constants/third-party'
import { inputLimits } from 'src/lib/constants/input-limits'
import { supplierTaxIdentificationModes, supplierTaxIdentificationModeValues } from 'src/lib/constants/third-party'

export const clientSupplierSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(inputLimits.maxNameLength, 'El nombre no puede superar los 255 caracteres'),
  cuit: cuitSchema,
}).strict()

export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(inputLimits.maxNameLength, 'El nombre no puede superar los 255 caracteres'),
  cuit: z.preprocess((value) => value === '' ? null : value, cuitSchema.nullable().optional()),
  taxIdentificationMode: z.enum(supplierTaxIdentificationModeValues).optional(),
}).strict().superRefine((data, context) => {
  const mode = data.taxIdentificationMode || (data.cuit ? supplierTaxIdentificationModes.withCuit : null)

  if (!mode) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Debe indicar la identificación tributaria del proveedor.', path: ['taxIdentificationMode'] })
    return
  }

  if (mode === supplierTaxIdentificationModes.withCuit && !data.cuit) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'El CUIT es obligatorio.', path: ['cuit'] })
  }

  if (mode === supplierTaxIdentificationModes.withoutCuit && data.cuit) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Un proveedor sin CUIT no puede tener un CUIT informado.', path: ['cuit'] })
  }
}).transform((data) => ({
  ...data,
  cuit: data.taxIdentificationMode === supplierTaxIdentificationModes.withoutCuit ? null : data.cuit || null,
  taxIdentificationMode: data.taxIdentificationMode || (data.cuit ? supplierTaxIdentificationModes.withCuit : supplierTaxIdentificationModes.withoutCuit),
}))

export const clientSupplierListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine((value) => thirdPartyPageSizeOptions.includes(value as typeof thirdPartyPageSizeOptions[number])).default(thirdPartyQueryDefaults.pageSize),
  search: z.string().trim().max(inputLimits.maxSearchLength, 'La búsqueda no puede superar los 255 caracteres').optional(),
  sortBy: z.enum(thirdPartySortByOptions).default(thirdPartyQueryDefaults.sortBy),
  sortOrder: z.enum(thirdPartySortOrderOptions).default(thirdPartyQueryDefaults.sortOrder),
})
