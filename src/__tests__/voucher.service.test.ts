import { VoucherService } from '../services/voucher.service'
import { VoucherRepository } from '../repositories/voucher.repository'
import { Voucher } from '../models/Voucher'
import { Decimal } from 'decimal.js'

// Mock the repository
jest.mock('../repositories/voucher.repository')

describe('VoucherService', () => {
  let service: VoucherService
  let repositoryMock: jest.Mocked<VoucherRepository>

  const validUUID = '123e4567-e89b-12d3-a456-426614174000'
  const company1 = 'company-1-uuid'

  beforeEach(() => {
    jest.clearAllMocks()
    repositoryMock = new VoucherRepository() as jest.Mocked<VoucherRepository>
    service = new VoucherService()

      // Inject the mock repository
      ; (service as unknown as { repository: VoucherRepository }).repository = repositoryMock
  })

  describe('createVoucher', () => {
    it('should create a valid voucher and calculate netAmount', async () => {
      const data = {
        companyId: company1,
        type: 'sale',
        voucherTypeId: validUUID,
        voucherLetterId: validUUID,
        posNumber: '00001',
        number: '00000123',
        clientId: validUUID,
        date: new Date(),
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
        paymentMethod: 'cash',
        retentions: [
          { retentionConceptId: validUUID, amount: 10 }
        ]
      }

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (v) => v)

      const result = await service.createVoucher(data)

      expect(repositoryMock.findDuplicate).toHaveBeenCalled()
      expect(repositoryMock.create).toHaveBeenCalled()

      // Net amount should be 121 - 10 = 111
      expect(result.netAmount).toEqual(new Decimal(111))
      expect(result.status).toBe('pending')
    })

    it('should derive paid status when paidAmount equals netAmount', async () => {
      const data = {
        companyId: company1,
        type: 'sale',
        voucherTypeId: validUUID,
        voucherLetterId: validUUID,
        posNumber: '00001',
        number: '00000123',
        clientId: validUUID,
        date: new Date(),
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
        paymentMethod: 'cash',
        paidAmount: 121, // Paid in full
        retentions: []
      }

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (v) => v)

      const result = await service.createVoucher(data)
      expect(result.status).toBe('paid')
    })

    it('should reject a duplicate voucher', async () => {
      const data = {
        companyId: company1,
        type: 'sale',
        voucherTypeId: validUUID,
        voucherLetterId: validUUID,
        posNumber: '00001',
        number: '00000123',
        clientId: validUUID,
        date: new Date(),
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
        paymentMethod: 'cash',
        retentions: []
      }

      repositoryMock.findDuplicate.mockResolvedValue(new Voucher(data))

      await expect(service.createVoucher(data)).rejects.toThrow('Voucher is a duplicate of an existing record')
      expect(repositoryMock.create).not.toHaveBeenCalled()
    })
  })

  describe('Data Isolation (Company ID)', () => {
    it('getAllVouchers should only fetch records for the specified company', async () => {
      repositoryMock.findAll.mockResolvedValue([])
      await service.getAllVouchers(company1)
      expect(repositoryMock.findAll).toHaveBeenCalledWith(company1, undefined)
    })
  })
})
