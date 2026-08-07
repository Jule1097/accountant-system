import { AnalyticsService } from '../services/analytics.service'
import { VoucherRepository } from '../repositories/voucher.repository'

jest.mock('../repositories/voucher.repository')

describe('AnalyticsService', () => {
  let service: AnalyticsService
  let repositoryMock: jest.Mocked<VoucherRepository>

  const companyId = 'company-test-uuid'

  beforeEach(() => {
    jest.clearAllMocks()
    repositoryMock = new VoucherRepository() as jest.Mocked<VoucherRepository>
    service = new AnalyticsService()
    service['repository'] = repositoryMock
  })

  it('should compute correct aggregated metrics by rolling period and currency', async () => {
    const now = new Date()
    const mockVouchers = [
      {
        companyId,
        type: 'sale',
        subtotal: 1000,
        totalAmount: 1210,
        currency: '$',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        retentions: [
          { amount: 100, retentionConcept: { name: 'Retención de Ganancias Sufrida' }, province: 'CABA' }
        ],
        vatDetails: [
          { vatAmount: 210 }
        ],
        client: { name: 'Client A', cuit: '20-11111111-2' },
        voucherType: { name: 'Factura' },
        clientId: 'client-1'
      },
      {
        companyId,
        type: 'purchase',
        subtotal: 500,
        totalAmount: 500,
        currency: 'USD',
        date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        retentions: [],
        vatDetails: [],
        supplier: { name: 'Supplier A', cuit: '30-22222222-3' },
        voucherType: { name: 'Factura' },
        supplierId: 'supplier-1'
      },
      {
        companyId,
        type: 'sale',
        subtotal: 200,
        totalAmount: 242,
        currency: '$',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        retentions: [],
        vatDetails: [
          { vatAmount: 42 }
        ],
        voucherType: { name: 'Nota de Crédito' }
      }
    ]

    repositoryMock.findForAnalytics.mockResolvedValue(mockVouchers as never)

    const result = await service.getAnalytics(companyId)

    const monthly = result.monthly
    expect(monthly.netSales.ARS).toBe(900)
    expect(monthly.salesCreditNotes.ARS).toBe(242)
    expect(monthly.vatDebit.ARS).toBe(168)
    expect(monthly.topClients[0].name).toBe('Client A')
    expect(monthly.topClients[0].total).toBe(900)

    const semiannual = result.semiannual
    expect(semiannual.netPurchases.USD).toBe(500)
    expect(semiannual.topSuppliers[0].name).toBe('Supplier A')

    expect(repositoryMock.findForAnalytics).toHaveBeenCalledWith(companyId, expect.any(Date))
  })
})
