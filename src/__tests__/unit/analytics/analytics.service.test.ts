import { AnalyticsService } from 'src/services/analytics/Analytics'
import { VoucherFactory } from 'src/models/voucher/VoucherFactory'
import { VoucherRepository } from 'src/repositories/voucher/voucher.repository'

jest.mock('src/repositories/voucher/voucher.repository')

describe('AnalyticsService', () => {
  let service: AnalyticsService
  let repositoryMock: jest.Mocked<VoucherRepository>

  const companyId = 'company-test-uuid'

  beforeEach(() => {
    jest.clearAllMocks()
    repositoryMock = new VoucherRepository() as jest.Mocked<VoucherRepository>
    service = new AnalyticsService()
    Object.defineProperty(service, "repository", { value: repositoryMock, writable: true })
  })

  it('should compute correct aggregated metrics by rolling period and currency', async () => {
    const now = new Date()
    const mockVouchers = [
      VoucherFactory.rehydrate({ companyId, type: 'sale', voucherTypeId: 'voucher-type-sale', voucherTypeCategory: 'standard', voucherLetterId: 'voucher-letter-sale', posNumber: '00001', number: '00000001', clientId: 'client-1', subtotal: 1000, vatAmount: 210, nonTaxableAmount: 0, exemptAmount: 0, otherTaxesAmount: 0, totalAmount: 1210, currency: '$', exchangeRate: 1, date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), retentions: [{ amount: 100, conceptName: 'Retencion de Ganancias Sufrida', taxJurisdictionName: 'CABA' }], perceptions: [], vatDetails: [{ vatAmount: 210 }], client: { name: 'Client A', cuit: '20-11111111-2' }, createdByUserId: 'user-1' }),
      VoucherFactory.rehydrate({ companyId, type: 'purchase', voucherTypeId: 'voucher-type-purchase', voucherTypeCategory: 'standard', voucherLetterId: 'voucher-letter-purchase', posNumber: '00001', number: '00000002', supplierId: 'supplier-1', subtotal: 500, vatAmount: 105, nonTaxableAmount: 40, exemptAmount: 10, otherTaxesAmount: 5, totalAmount: 675, currency: 'USD', exchangeRate: 1000, date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), retentions: [], perceptions: [{ amount: 15, conceptName: 'Percepcion de Ingresos Brutos', taxJurisdictionName: 'CABA' }], vatDetails: [{ vatAmount: 105 }], supplier: { name: 'Supplier A', cuit: '30-22222222-3' }, createdByUserId: 'user-1' }),
      VoucherFactory.rehydrate({ companyId, type: 'sale', voucherTypeId: 'voucher-type-credit', voucherTypeCategory: 'credit_note', voucherLetterId: 'voucher-letter-sale', posNumber: '00001', number: '00000003', clientId: 'client-2', subtotal: 200, vatAmount: 42, nonTaxableAmount: 0, exemptAmount: 0, otherTaxesAmount: 0, totalAmount: 242, currency: '$', exchangeRate: 1, date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), retentions: [], perceptions: [], vatDetails: [{ vatAmount: 42 }], createdByUserId: 'user-1' }),
    ]

    repositoryMock.findForAnalytics.mockResolvedValue(mockVouchers)

    const result = await service.getAnalytics(companyId)

    expect(result.monthly.netSales.ARS).toBe(700)
    expect(result.monthly.salesCreditNotes.ARS).toBe(242)
    expect(result.monthly.vatDebit.ARS).toBe(168)
    expect(result.monthly.topClients[0].name).toBe('Client A')
    expect(result.monthly.topClients[0].total).toBe(1000)
    expect(result.semiannual.netPurchases.USD).toBe(555)
    expect(result.semiannual.perceptions[0].total).toBe(15)
    expect(result.semiannual.perceptions[0].currency).toBe('USD')
    expect(result.semiannual.topSuppliers[0].name).toBe('Supplier A')
    expect(repositoryMock.findForAnalytics).toHaveBeenCalledWith(companyId, expect.any(Date))
  })
})
