import { voucherSchema, cuitSchema } from '../lib/schemas/voucher'

describe('Zod Validation Schemas', () => {
  const validUUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

  describe('CUIT Validation', () => {
    it('should validate correct CUIT formats', () => {
      expect(cuitSchema.safeParse('30-11111111-9').success).toBe(true)
      expect(cuitSchema.safeParse('30111111119').success).toBe(true)
    })

    it('should reject invalid CUIT formats', () => {
      expect(cuitSchema.safeParse('30-11111111').success).toBe(false)
      expect(cuitSchema.safeParse('123').success).toBe(false)
      expect(cuitSchema.safeParse('abc-12345678-d').success).toBe(false)
    })
  })

  describe('Voucher Schema', () => {
    const baseVoucher = {
      companyId: validUUID,
      voucherTypeId: validUUID,
      voucherLetterId: validUUID,
      posNumber: '1', // Should auto-pad to '00001'
      number: '123', // Should auto-pad to '00000123'
      date: '2026-07-30',
      currency: '$',
      exchangeRate: 1,
      subtotal: 1000,
      vatAmount: 210,
      totalAmount: 1210,
      paymentMethod: 'Transferencia',
      status: 'pending',
      createdByUserId: validUUID,
    }

    it('should validate and transform a valid sale voucher', () => {
      const saleVoucher = {
        ...baseVoucher,
        type: 'sale',
        clientId: validUUID,
      }

      const result = voucherSchema.safeParse(saleVoucher)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.posNumber).toBe('00001')
        expect(result.data.number).toBe('00000123')
        expect(result.data.accountingPeriod.toISOString()).toContain('2026-07-01')
      }
    })

    it('should validate and transform a valid purchase voucher', () => {
      const purchaseVoucher = {
        ...baseVoucher,
        type: 'purchase',
        supplierId: validUUID,
      }

      const result = voucherSchema.safeParse(purchaseVoucher)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.posNumber).toBe('00001')
        expect(result.data.number).toBe('00000123')
      }
    })

    it('should reject a sale voucher without a client ID', () => {
      const invalidSale = {
        ...baseVoucher,
        type: 'sale',
        supplierId: validUUID, // Wrong relation for sale
      }
      expect(voucherSchema.safeParse(invalidSale).success).toBe(false)
    })

    it('should reject a purchase voucher without a supplier ID', () => {
      const invalidPurchase = {
        ...baseVoucher,
        type: 'purchase',
        clientId: validUUID, // Wrong relation for purchase
      }
      expect(voucherSchema.safeParse(invalidPurchase).success).toBe(false)
    })

    it('should enforce exchangeRate of 1 for Pesos ($)', () => {
      const pesoVoucher = {
        ...baseVoucher,
        type: 'sale',
        clientId: validUUID,
        currency: '$',
        exchangeRate: 150, // Invalid, must be 1
      }
      expect(voucherSchema.safeParse(pesoVoucher).success).toBe(false)
    })

    it('should require a positive exchangeRate for USD', () => {
      const usdVoucher = {
        ...baseVoucher,
        type: 'sale',
        clientId: validUUID,
        currency: 'USD',
        exchangeRate: 175, // Valid
      }
      expect(voucherSchema.safeParse(usdVoucher).success).toBe(true)
    })
  })
})
