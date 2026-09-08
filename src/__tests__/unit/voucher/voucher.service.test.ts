import { VoucherFactory } from 'src/models/voucher/VoucherFactory'
import { VoucherRepository } from 'src/repositories/voucher/voucher.repository'
import { VoucherService } from 'src/services/voucher/Voucher'
import { VoucherFactoryInput } from 'src/types/voucher/domain'
import { applicationErrorCodes } from 'src/lib/constants/application-error'

jest.mock('src/repositories/voucher/voucher.repository')

describe('VoucherService', () => {
  let service: VoucherService
  let repositoryMock: jest.Mocked<VoucherRepository>

  const validUuid = '123e4567-e89b-12d3-a456-426614174000'
  const companyId = 'company-1-uuid'
  const createVoucherData = (overrides: Partial<VoucherFactoryInput> = {}): VoucherFactoryInput => ({
    companyId,
    type: 'sale',
    voucherTypeId: validUuid,
    voucherLetterId: validUuid,
    posNumber: '00001',
    number: '00000123',
    clientId: validUuid,
    supplierId: null,
    date: new Date().toISOString(),
    currency: '$',
    exchangeRate: 1,
    subtotal: 100,
    vatAmount: 21,
    totalAmount: 121,
    paymentMethod: 'cash',
    paidAmount: 0,
    status: null,
    paymentDate: null,
    concept: null,
    comments: null,
    createdByUserId: validUuid,
    retentions: [],
    perceptions: [],
    vatDetails: [],
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    repositoryMock = new VoucherRepository() as jest.Mocked<VoucherRepository>
    service = new VoucherService()
    Object.defineProperty(service, "repository", { value: repositoryMock, writable: true })
  })

  describe('createVoucher', () => {
    it('should create a valid sales voucher and calculate netAmount', async () => {
      const voucherData = createVoucherData({ retentions: [{ retentionConceptId: validUuid, amount: 10 }] })

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (voucher) => voucher)

      const result = await service.createVoucher(voucherData)

      expect(result.totalAmount.toString()).toBe('121.00')
      expect(result.netAmount.toString()).toBe('111.00')
      expect(result.status).toBe('pending')
    })

    it('should derive accountingPeriod from date when it is missing', async () => {
      const voucherData = createVoucherData({ date: '2026-08-18T00:00:00.000Z' })

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (voucher) => voucher)

      const result = await service.createVoucher(voucherData)

      expect(result.accountingPeriod).toBe('2026-08-01')
    })

    it('should calculate purchase totals including perceptions and extra fields', async () => {
      const voucherData = createVoucherData({ type: 'purchase', clientId: null, supplierId: validUuid, nonTaxableAmount: 5, exemptAmount: 7, otherTaxesAmount: 8, totalAmount: 0, perceptions: [{ perceptionConceptId: validUuid, amount: 9, taxJurisdictionId: validUuid }] })

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (voucher) => voucher)

      const result = await service.createVoucher(voucherData)

      expect(result.totalAmount.toString()).toBe('150.00')
      expect(result.netAmount.toString()).toBe('150.00')
    })

    it('should derive paid status when paidAmount equals netAmount', async () => {
      const voucherData = createVoucherData({ paidAmount: 121 })

      repositoryMock.findDuplicate.mockResolvedValue(null)
      repositoryMock.create.mockImplementation(async (voucher) => voucher)

      const result = await service.createVoucher(voucherData)
      expect(result.status).toBe('paid')
    })

    it('should reject a duplicate voucher', async () => {
      const voucherData = createVoucherData()

      repositoryMock.findDuplicate.mockResolvedValue(VoucherFactory.create({ ...voucherData, currency: 'ARS', accountingPeriod: voucherData.date, vatDetails: [], perceptions: [], createdByUserId: validUuid }))

      await expect(service.createVoucher(voucherData)).rejects.toMatchObject({ code: applicationErrorCodes.duplicate, publicMessage: 'Comprobante duplicado detectado.' })
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

  describe('deleteVoucher', () => {
    it('should reject when the voucher does not exist', async () => {
      repositoryMock.findById.mockResolvedValue(null)

      await expect(service.deleteVoucher(companyId, validUuid)).rejects.toMatchObject({ code: applicationErrorCodes.notFound, publicMessage: 'Comprobante no encontrado.' })
      expect(repositoryMock.delete).not.toHaveBeenCalled()
    })
  })
})
