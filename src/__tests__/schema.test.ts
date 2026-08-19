import { cuitSchema, voucherSchema } from '../lib/schemas/voucher-schemas'

describe('Zod Validation Schemas', () => {
  const validUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

  describe('CUIT Validation', () => {
    it('should validate and normalize correct CUIT formats', () => {
      const formattedCuit = cuitSchema.safeParse('30-11111111-9')
      const numericCuit = cuitSchema.safeParse('30111111119')

      expect(formattedCuit.success).toBe(true)
      expect(numericCuit.success).toBe(true)

      if (formattedCuit.success) {
        expect(formattedCuit.data).toBe('30-11111111-9')
      }

      if (numericCuit.success) {
        expect(numericCuit.data).toBe('30-11111111-9')
      }
    })

    it('should reject invalid CUIT formats', () => {
      expect(cuitSchema.safeParse('30-11111111').success).toBe(false)
      expect(cuitSchema.safeParse('123').success).toBe(false)
      expect(cuitSchema.safeParse('abc-12345678-d').success).toBe(false)
    })
  })

  describe('Voucher Schema', () => {
    const baseVoucher = {
      companyId: validUuid,
      voucherTypeId: validUuid,
      voucherLetterId: validUuid,
      posNumber: '1',
      number: '123',
      date: '2026-07-30',
      currency: '$',
      exchangeRate: 1,
      subtotal: 1000,
      vatAmount: 210,
      totalAmount: 1210,
      paymentMethod: 'Transferencia',
      status: 'pending',
      createdByUserId: validUuid,
    }

    it('should validate and transform a valid sale voucher', () => {
      const result = voucherSchema.safeParse({
        ...baseVoucher,
        type: 'sale',
        clientId: validUuid,
        retentions: [{ retentionConceptId: validUuid, amount: 10, taxJurisdictionId: validUuid }],
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.posNumber).toBe('00001')
        expect(result.data.number).toBe('00000123')
        expect(result.data.accountingPeriod.getFullYear()).toBe(2026)
        expect(result.data.accountingPeriod.getMonth()).toBe(6)
        expect(result.data.accountingPeriod.getDate()).toBe(1)
      }
    })

    it('should validate a valid purchase voucher with perceptions and tax breakdown fields', () => {
      const result = voucherSchema.safeParse({
        ...baseVoucher,
        type: 'purchase',
        supplierId: validUuid,
        nonTaxableAmount: 50,
        exemptAmount: 25,
        otherTaxesAmount: 15,
        perceptions: [{ perceptionConceptId: validUuid, amount: 35, taxJurisdictionId: validUuid }],
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.posNumber).toBe('00001')
        expect(result.data.number).toBe('00000123')
      }
    })

    it('should reject a sale voucher without a client ID', () => {
      expect(voucherSchema.safeParse({
        ...baseVoucher,
        type: 'sale',
        supplierId: validUuid,
      }).success).toBe(false)
    })

    it('should reject a purchase voucher without a supplier ID', () => {
      expect(voucherSchema.safeParse({
        ...baseVoucher,
        type: 'purchase',
        clientId: validUuid,
      }).success).toBe(false)
    })

    it('should reject perceptions on sales vouchers', () => {
      expect(voucherSchema.safeParse({
        ...baseVoucher,
        type: 'sale',
        clientId: validUuid,
        perceptions: [{ perceptionConceptId: validUuid, amount: 10 }],
      }).success).toBe(false)
    })

    it('should reject retentions on purchase vouchers', () => {
      expect(voucherSchema.safeParse({
        ...baseVoucher,
        type: 'purchase',
        supplierId: validUuid,
        retentions: [{ retentionConceptId: validUuid, amount: 10 }],
      }).success).toBe(false)
    })

    it('should reject zeroed voucher identifiers', () => {
      expect(voucherSchema.safeParse({
        ...baseVoucher,
        type: 'purchase',
        supplierId: validUuid,
        posNumber: '00000',
        number: '00000000',
      }).success).toBe(false)
    })

    it('should enforce exchangeRate of 1 for Pesos ($)', () => {
      expect(voucherSchema.safeParse({
        ...baseVoucher,
        type: 'sale',
        clientId: validUuid,
        exchangeRate: 150,
      }).success).toBe(false)
    })

    it('should require a positive exchangeRate for USD', () => {
      expect(voucherSchema.safeParse({
        ...baseVoucher,
        type: 'sale',
        clientId: validUuid,
        currency: 'USD',
        exchangeRate: 175,
      }).success).toBe(true)
    })
  })
})
