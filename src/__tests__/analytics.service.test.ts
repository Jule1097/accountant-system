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
    ;(service as unknown as { repository: VoucherRepository }).repository = repositoryMock
  })

  it('should compute correct aggregated metrics by rolling period and currency', async () => {
    const now = new Date()
    const mockVouchers = [
      {
        companyId,
        type: 'sale',
        subtotal: 1000,
        vatAmount: 210,
        nonTaxableAmount: 0,
        exemptAmount: 0,
        otherTaxesAmount: 0,
        totalAmount: 1210,
        currency: '$',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        retentions: [
          {
            amount: 100,
            retentionConcept: { name: 'Retención de Ganancias Sufrida' },
            taxJurisdiction: { id: 'jur-caba', name: 'CABA' },
          },
        ],
        perceptions: [],
        vatDetails: [{ vatAmount: 210 }],
        client: { name: 'Client A', cuit: '20-11111111-2' },
        voucherType: { name: 'Factura' },
        clientId: 'client-1',
      },
      {
        companyId,
        type: 'purchase',
        subtotal: 500,
        vatAmount: 105,
        nonTaxableAmount: 40,
        exemptAmount: 10,
        otherTaxesAmount: 5,
        totalAmount: 675,
        currency: 'USD',
        date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        retentions: [],
        perceptions: [
          {
            amount: 15,
            perceptionConcept: { name: 'Percepción de Ingresos Brutos' },
            taxJurisdiction: { id: 'jur-caba', name: 'CABA' },
          },
        ],
        vatDetails: [{ vatAmount: 105 }],
        supplier: { name: 'Supplier A', cuit: '30-22222222-3' },
        voucherType: { name: 'Factura' },
        supplierId: 'supplier-1',
      },
      {
        companyId,
        type: 'sale',
        subtotal: 200,
        vatAmount: 42,
        nonTaxableAmount: 0,
        exemptAmount: 0,
        otherTaxesAmount: 0,
        totalAmount: 242,
        currency: '$',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        retentions: [],
        perceptions: [],
        vatDetails: [{ vatAmount: 42 }],
        voucherType: { name: 'Nota de Crédito' },
      },
    ]

    repositoryMock.findForAnalytics.mockResolvedValue(mockVouchers as never)

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
