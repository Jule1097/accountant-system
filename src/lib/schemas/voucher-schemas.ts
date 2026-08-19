import { z } from 'zod'
import { normalizeCuit } from 'src/lib/cuit'

function isNonZeroVoucherValue(value: string): boolean {
  return Number(value) > 0
}

export const cuitSchema = z
  .string()
  .min(10, 'El CUIT debe tener al menos 10 dígitos')
  .max(13, 'El CUIT no puede exceder los 13 caracteres')
  .regex(/^\d{2}-\d{8}-\d{1}$|^\d{11}$/, 'Formato de CUIT inválido (ej: 30-11111111-9 o 30111111119)')
  .transform((value) => normalizeCuit(value))

export const companySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  cuit: cuitSchema,
})

export const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  cuit: cuitSchema,
  companyId: z.string().uuid('ID de empresa inválido'),
})

export const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  cuit: cuitSchema,
  companyId: z.string().uuid('ID de empresa inválido'),
})

export const voucherRetentionSchema = z.object({
  retentionConceptId: z.string().uuid('ID de concepto de retención inválido'),
  taxJurisdictionId: z.string().uuid('ID de jurisdicción inválido').optional().nullable(),
  amount: z.coerce.number().nonnegative('El monto de retención no puede ser negativo'),
})

export const voucherPerceptionSchema = z.object({
  perceptionConceptId: z.string().uuid('ID de concepto de percepción inválido'),
  taxJurisdictionId: z.string().uuid('ID de jurisdicción inválido').optional().nullable(),
  amount: z.coerce.number().nonnegative('El monto de percepción no puede ser negativo'),
})

export const voucherVatDetailSchema = z.object({
  vatRateId: z.string().uuid('ID de alícuota de IVA inválido'),
  subtotal: z.coerce.number().nonnegative('El subtotal de IVA no puede ser negativo'),
  vatAmount: z.coerce.number().nonnegative('El monto de IVA no puede ser negativo'),
})

export const voucherSchema = z
  .object({
    companyId: z.string().uuid('ID de empresa inválido'),
    type: z.enum(['sale', 'purchase'], {
      message: "El tipo debe ser 'sale' o 'purchase'",
    }),
    voucherTypeId: z.string().uuid('ID de tipo de comprobante inválido'),
    voucherLetterId: z.string().uuid('ID de letra de comprobante inválido'),
    posNumber: z
      .string()
      .regex(/^\d+$/, 'El punto de venta debe contener solo números')
      .refine(isNonZeroVoucherValue, 'El punto de venta debe ser mayor a cero')
      .transform((value) => value.padStart(5, '0')),
    number: z
      .string()
      .regex(/^\d+$/, 'El número de comprobante debe contener solo números')
      .refine(isNonZeroVoucherValue, 'El número de comprobante debe ser mayor a cero')
      .transform((value) => value.padStart(8, '0')),
    clientId: z.string().uuid('ID de cliente inválido').nullable().optional(),
    supplierId: z.string().uuid('ID de proveedor inválido').nullable().optional(),
    date: z.coerce.date({ message: 'Fecha inválida' }),
    accountingPeriod: z.coerce.date({ message: 'Período contable inválido' }).optional(),
    currency: z.enum(['$', 'USD'], {
      message: "La moneda debe ser '$' o 'USD'",
    }),
    exchangeRate: z.coerce
      .number()
      .positive('El tipo de cambio debe ser un número positivo')
      .optional()
      .default(1),
    subtotal: z.coerce.number().nonnegative('El subtotal no puede ser negativo'),
    vatAmount: z.coerce.number().nonnegative('El IVA no puede ser negativo'),
    nonTaxableAmount: z.coerce.number().nonnegative('El monto no gravado no puede ser negativo').optional().default(0),
    exemptAmount: z.coerce.number().nonnegative('El monto exento no puede ser negativo').optional().default(0),
    otherTaxesAmount: z.coerce.number().nonnegative('El monto de otros impuestos no puede ser negativo').optional().default(0),
    totalAmount: z.coerce.number().positive('El monto total debe ser mayor a cero'),
    concept: z.string().optional(),
    paymentMethod: z.string().min(1, 'El método de pago es obligatorio'),
    status: z.enum(['pending', 'partial', 'paid'], {
      message: "El estado debe ser 'pending', 'partial' o 'paid'",
    }),
    paymentDate: z.coerce.date().nullable().optional(),
    paidAmount: z.coerce.number().nonnegative().optional().default(0),
    comments: z.string().optional(),
    createdByUserId: z.string().uuid('ID de usuario creador inválido'),
    retentions: z.array(voucherRetentionSchema).optional().default([]),
    perceptions: z.array(voucherPerceptionSchema).optional().default([]),
    vatDetails: z.array(voucherVatDetailSchema).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.type === 'sale') {
        return !!data.clientId && !data.supplierId
      }

      return !!data.supplierId && !data.clientId
    },
    {
      message: 'Debe especificar el cliente para ventas, o el proveedor para compras.',
      path: ['clientId'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'sale') {
        return data.perceptions.length === 0
      }

      return data.retentions.length === 0
    },
    {
      message: 'Las ventas solo admiten retenciones y las compras solo admiten percepciones.',
      path: ['retentions'],
    }
  )
  .refine(
    (data) => {
      if (data.currency === 'USD') {
        return data.exchangeRate > 0 && data.exchangeRate !== 1
      }

      return data.exchangeRate === 1
    },
    {
      message: 'Si la moneda es Pesos ($), el tipo de cambio debe ser 1. Si es USD, debe ser mayor a 0.',
      path: ['exchangeRate'],
    }
  )
  .transform((data) => {
    const accountingPeriod = data.accountingPeriod
      ? new Date(data.accountingPeriod.getFullYear(), data.accountingPeriod.getMonth(), 1)
      : new Date(data.date.getFullYear(), data.date.getMonth(), 1)

    return {
      ...data,
      accountingPeriod,
    }
  })

export const voucherListQuerySchema = z.object({
  type: z.enum(['sale', 'purchase']),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine((value) => [10, 20, 50].includes(value)).default(10),
  search: z.string().trim().optional(),
  status: z.enum(['pending', 'partial', 'paid']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['date', 'status', 'voucher']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const voucherSummaryQuerySchema = voucherListQuerySchema.omit({
  page: true,
  pageSize: true,
}).extend({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().optional(),
})
