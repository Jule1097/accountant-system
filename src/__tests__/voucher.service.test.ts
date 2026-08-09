import { Decimal } from 'decimal.js'
import { Voucher } from '../models/Voucher'
import { VoucherRepository } from '../repositories/voucher.repository'
import { VoucherService } from '../services/voucher.service'

jest.mock('../repositories/voucher.repository')

describe('VoucherService', () => {
  let service: VoucherService
  let repositoryMock: jest.Mocked<VoucherRepository>

  const validUuid = '123e4567-e89b-12d3-a456-426614174000'
  const companyId = 'company-1-uuid'

  beforeEach(() => {
    jest.clearAllMocks()
    repositoryMock = new VoucherRepository() as jest.Mocked<VoucherRepository>
    service = new VoucherService()
    ;(service as unknown as { repository: VoucherRepository }).repository = repositoryMock
  })

  describe('createVoucher', () => {
    it('should create a valid sales voucher and calculate netAmount', async () => {
      const voucherData = {
        companyId,
        type: 'sale',
        voucherTypeId: validUuid,
        voucherLetterId: validUuid,
        posNumber: '00001',
        number: '00000123',
        clientId: validUuid,
        date: new Date(),
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
        paymentMethod: 'cash',
        retentions: [{ retentionConceptId: validUuid, amount: 10 }],
      }

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (voucher) => voucher)

      const result = await service.createVoucher(voucherData)

      expect(result.totalAmount).toEqual(new Decimal(121))
      expect(result.netAmount).toEqual(new Decimal(111))
      expect(result.status).toBe('pending')
    })

    it('should calculate purchase totals including perceptions and extra fields', async () => {
      const voucherData = {
        companyId,
        type: 'purchase',
        voucherTypeId: validUuid,
        voucherLetterId: validUuid,
        posNumber: '00001',
        number: '00000123',
        supplierId: validUuid,
        date: new Date(),
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        nonTaxableAmount: 5,
        exemptAmount: 7,
        otherTaxesAmount: 8,
        totalAmount: 0,
        paymentMethod: 'cash',
        perceptions: [{ perceptionConceptId: validUuid, amount: 9, taxJurisdictionId: validUuid }],
      }

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (voucher) => voucher)

      const result = await service.createVoucher(voucherData)

      expect(result.totalAmount).toEqual(new Decimal(150))
      expect(result.netAmount).toEqual(new Decimal(150))
    })

    it('should derive paid status when paidAmount equals netAmount', async () => {
      const voucherData = {
        companyId,
        type: 'sale',
        voucherTypeId: validUuid,
        voucherLetterId: validUuid,
        posNumber: '00001',
        number: '00000123',
        clientId: validUuid,
        date: new Date(),
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
        paymentMethod: 'cash',
        paidAmount: 121,
        retentions: [],
      }

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (voucher) => voucher)

      const result = await service.createVoucher(voucherData)
      expect(result.status).toBe('paid')
    })

    it('should reject a duplicate voucher', async () => {
      const voucherData = {
        companyId,
        type: 'sale',
        voucherTypeId: validUuid,
        voucherLetterId: validUuid,
        posNumber: '00001',
        number: '00000123',
        clientId: validUuid,
        date: new Date(),
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
        paymentMethod: 'cash',
        retentions: [],
      }

      repositoryMock.findDuplicate.mockResolvedValue(new Voucher(voucherData))

      await expect(service.createVoucher(voucherData)).rejects.toThrow('Voucher is a duplicate of an existing record')
      expect(repositoryMock.create).not.toHaveBeenCalled()
    })
  })

  describe('Data Isolation (Company ID)', () => {
    it('getAllVouchers should only fetch records for the specified company', async () => {
      repositoryMock.findAll.mockResolvedValue([])
      await service.getAllVouchers(companyId)
      expect(repositoryMock.findAll).toHaveBeenCalledWith(companyId, undefined)
    })
  })
})
