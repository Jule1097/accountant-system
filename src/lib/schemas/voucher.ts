import { z } from 'zod'

// 1. CUIT Validator
export const cuitSchema = z
  .string()
  .min(10, 'El CUIT debe tener al menos 10 dígitos')
  .max(13, 'El CUIT no puede exceder los 13 caracteres')
  .regex(/^\d{2}-\d{8}-\d{1}$|^\d{11}$/, 'Formato de CUIT inválido (ej: 30-11111111-9 o 30111111119)')

// 2. Base Company Validator
export const companySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  cuit: cuitSchema,
})

// 3. Client Validator
export const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  cuit: cuitSchema,
  companyId: z.string().uuid('ID de empresa inválido'),
})

// 4. Supplier Validator
export const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  cuit: cuitSchema,
  companyId: z.string().uuid('ID de empresa inválido'),
})

// 5. Voucher Validator
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
      .transform((val) => val.padStart(5, '0')), // Auto-pad to 5 digits
    number: z
      .string()
      .regex(/^\d+$/, 'El número de comprobante debe contener solo números')
      .transform((val) => val.padStart(8, '0')), // Auto-pad to 8 digits
    clientId: z.string().uuid('ID de cliente inválido').nullable().optional(),
    supplierId: z.string().uuid('ID de proveedor inválido').nullable().optional(),
    date: z.coerce.date({ message: 'Fecha inválida' }),
    accountingPeriod: z.coerce
      .date({ message: 'Período contable inválido' })
      .optional(),
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
  })
  .refine(
    (data) => {
      // Rule: For sales, clientId is required and supplierId is empty
      if (data.type === 'sale') {
        return !!data.clientId && !data.supplierId
      }
      // Rule: For purchases, supplierId is required and clientId is empty
      if (data.type === 'purchase') {
        return !!data.supplierId && !data.clientId
      }
      return false;
    },
    {
      message: 'Debe especificar el cliente para ventas, o el proveedor para compras.',
      path: ['clientId'],
    }
  )
  .refine(
    (data) => {
      // Rule: If currency is USD, exchangeRate is mandatory and must be > 0 (handled by positive() above)
      if (data.currency === 'USD') {
        return data.exchangeRate > 0 && data.exchangeRate !== 1 // Assuming 1 is default, USD needs real rate
      }
      // Rule: If currency is $, exchangeRate must be 1
      if (data.currency === '$') {
        return data.exchangeRate === 1
      }
      return true;
    },
    {
      message: 'Si la moneda es Pesos ($), el tipo de cambio debe ser 1. Si es USD, debe ser mayor a 0.',
      path: ['exchangeRate'],
    }
  )
  .transform((data) => {
    // Auto-derive accountingPeriod from date if not provided
    // standardized to first day of the month
    const derivedPeriod = data.accountingPeriod
      ? new Date(data.accountingPeriod.getFullYear(), data.accountingPeriod.getMonth(), 1)
      : new Date(data.date.getFullYear(), data.date.getMonth(), 1)

    return {
      ...data,
      accountingPeriod: derivedPeriod,
    }
  })
