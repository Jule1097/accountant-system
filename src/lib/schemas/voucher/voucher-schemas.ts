import { z } from 'zod'
import Decimal from 'decimal.js'
import { normalizeCuit } from 'src/lib/domain/cuit'
import { inputLimits } from 'src/lib/constants/input-limits'
import {
  voucherExchangeRateMaximum,
  voucherExchangeRateScale,
  voucherMoneyMaximum,
  voucherPageSizeOptions,
  voucherMoneyScale,
  voucherValidationMessages,
} from 'src/lib/constants/voucher'

function isNonZeroVoucherValue(value: string): boolean {
  return Number(value) > 0
}

function hasDecimalScale(value: number, scale: number): boolean {
  return new Decimal(value).decimalPlaces() <= scale
}

function createDecimalSchema(maximum: number, scale: number, invalidMessage: string, excessiveMessage: string, scaleMessage: string) {
  return z.coerce.number()
    .refine(Number.isFinite, invalidMessage)
    .max(maximum, excessiveMessage)
    .refine((value) => hasDecimalScale(value, scale), scaleMessage)
}

function createMoneySchema(message: string, positive = false) {
  const schema = createDecimalSchema(voucherMoneyMaximum, voucherMoneyScale, voucherValidationMessages.invalidFiniteAmount, voucherValidationMessages.excessiveAmount, voucherValidationMessages.excessiveAmountScale)
  return positive ? schema.positive(message) : schema.nonnegative(message)
}

const exchangeRateSchema = createDecimalSchema(voucherExchangeRateMaximum, voucherExchangeRateScale, voucherValidationMessages.invalidFiniteExchangeRate, voucherValidationMessages.excessiveExchangeRate, voucherValidationMessages.excessiveExchangeRateScale)

export const cuitSchema = z
  .string()
  .min(10, 'El CUIT debe tener al menos 10 dígitos')
  .max(13, 'El CUIT no puede exceder los 13 caracteres')
  .regex(/^\d{2}-\d{8}-\d{1}$|^\d{11}$/, 'Formato de CUIT inválido (ej: 30-11111111-9 o 30111111119)')
  .transform((value) => normalizeCuit(value))

export const companySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(inputLimits.maxNameLength, 'El nombre no puede superar los 255 caracteres'),
  cuit: cuitSchema,
}).strict()

export const clientSchema = z.strictObject({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(inputLimits.maxNameLength, 'El nombre no puede superar los 255 caracteres'),
  cuit: cuitSchema,
  companyId: z.string().uuid('ID de empresa inválido'),
})

export const supplierSchema = z.strictObject({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(inputLimits.maxNameLength, 'El nombre no puede superar los 255 caracteres'),
  cuit: cuitSchema,
  companyId: z.string().uuid('ID de empresa inválido'),
})

const optionalVoucherTaxJurisdictionSchema = z.preprocess(
  (value) => value === '' ? null : value,
  z.string().uuid('ID de jurisdicción inválido').optional().nullable()
)

export const voucherRetentionSchema = z.strictObject({
  retentionConceptId: z.string().uuid('ID de concepto de retención inválido'),
  taxJurisdictionId: optionalVoucherTaxJurisdictionSchema,
  amount: createMoneySchema('El monto de retención no puede ser negativo'),
})

export const voucherPerceptionSchema = z.strictObject({
  perceptionConceptId: z.string().uuid('ID de concepto de percepción inválido'),
  taxJurisdictionId: optionalVoucherTaxJurisdictionSchema,
  amount: createMoneySchema('El monto de percepción no puede ser negativo'),
})

export const voucherVatDetailSchema = z.strictObject({
  vatRateId: z.string().uuid('ID de alícuota de IVA inválido'),
  subtotal: createMoneySchema('El subtotal de IVA no puede ser negativo'),
  vatAmount: createMoneySchema('El monto de IVA no puede ser negativo'),
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
    exchangeRate: exchangeRateSchema
      .positive('El tipo de cambio debe ser un número positivo')
      .optional()
      .default(1),
    subtotal: createMoneySchema('El subtotal no puede ser negativo'),
    vatAmount: createMoneySchema('El IVA no puede ser negativo'),
    nonTaxableAmount: createMoneySchema('El monto no gravado no puede ser negativo').optional().default(0),
    exemptAmount: createMoneySchema('El monto exento no puede ser negativo').optional().default(0),
    otherTaxesAmount: createMoneySchema('El monto de otros impuestos no puede ser negativo').optional().default(0),
    totalAmount: createMoneySchema('El monto total debe ser mayor a cero', true),
    concept: z.string().trim().max(inputLimits.maxFreeTextLength, 'El concepto no puede superar los 5000 caracteres').optional(),
    paymentMethod: z.string().trim().min(1, 'El método de pago es obligatorio').max(inputLimits.maxNameLength, 'El medio de pago no puede superar los 255 caracteres'),
    status: z.enum(['pending', 'partial', 'paid'], {
      message: "El estado debe ser 'pending', 'partial' o 'paid'",
    }),
    paymentDate: z.coerce.date().nullable().optional(),
    paidAmount: createMoneySchema('El monto pagado no puede ser negativo').optional().default(0),
    comments: z.string().trim().max(inputLimits.maxFreeTextLength, 'Los comentarios no pueden superar los 5000 caracteres').optional(),
    createdByUserId: z.string().uuid('ID de usuario creador inválido'),
    retentions: z.array(voucherRetentionSchema).optional().default([]),
    perceptions: z.array(voucherPerceptionSchema).optional().default([]),
    vatDetails: z.array(voucherVatDetailSchema).optional().default([]),
  })
  .strict()
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

export type VoucherSchemaOutput = z.output<typeof voucherSchema>

export const voucherListQuerySchema = z.object({
  type: z.enum(['sale', 'purchase']),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine((value) => voucherPageSizeOptions.includes(value as typeof voucherPageSizeOptions[number])).default(voucherPageSizeOptions[0]),
  search: z.string().trim().max(inputLimits.maxSearchLength, 'La búsqueda no puede superar los 255 caracteres').optional(),
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
  pageSize: z.coerce.number().int().refine((value) => voucherPageSizeOptions.includes(value as typeof voucherPageSizeOptions[number]), 'El tamaño de página es inválido').optional(),
})
