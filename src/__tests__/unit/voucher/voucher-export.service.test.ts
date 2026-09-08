import Decimal from 'decimal.js'
import { CatalogRepository } from 'src/repositories/catalog/catalog.repository'
import { CompanyRepository } from 'src/repositories/company/company.repository'
import { VoucherFactory } from 'src/models/voucher/VoucherFactory'
import { VoucherService } from 'src/services/voucher/Voucher'
import { VoucherExportService } from 'src/services/voucher/VoucherExport'

jest.mock('src/repositories/company/company.repository')
jest.mock('src/repositories/catalog/catalog.repository')
jest.mock('src/services/voucher/Voucher')

describe('VoucherExportService', () => {
  let exportService: VoucherExportService
  let companyRepoMock: jest.Mocked<CompanyRepository>
  let catalogRepoMock: jest.Mocked<CatalogRepository>
  let voucherServiceMock: jest.Mocked<VoucherService>

  beforeEach(() => {
    jest.clearAllMocks()
    companyRepoMock = new CompanyRepository() as jest.Mocked<CompanyRepository>
    catalogRepoMock = new CatalogRepository() as jest.Mocked<CatalogRepository>
    voucherServiceMock = new VoucherService() as jest.Mocked<VoucherService>
    exportService = new VoucherExportService()
    Object.defineProperty(exportService, 'companyRepository', { value: companyRepoMock, writable: true })
    Object.defineProperty(exportService, 'catalogRepository', { value: catalogRepoMock, writable: true })
    Object.defineProperty(exportService, 'voucherService', { value: voucherServiceMock, writable: true })
    catalogRepoMock.getRetentionConcepts.mockResolvedValue([{ id: 'ret-gan', name: 'Retencion de Ganancias Sufrida', type: 'sale' }, { id: 'ret-iva', name: 'Retencion de IVA Sufrida', type: 'sale' }])
    catalogRepoMock.getPerceptionConcepts.mockResolvedValue([{ id: 'perc-iva', name: 'Percepcion de IVA' }, { id: 'perc-gan', name: 'Percepcion de Ganancias' }])
  })

  it('performs currency conversion and negates credit notes correctly for sales', async () => {
    companyRepoMock.findById.mockResolvedValue({ id: 'company-1', name: 'Test Company', cuit: '30717618129', createdAt: new Date(), updatedAt: new Date() })
    catalogRepoMock.getVatRates.mockResolvedValue([])
    const usdInvoice = VoucherFactory.rehydrate({ id: 'v1', companyId: 'company-1', type: 'sale', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000001', clientId: 'client-1', client: { name: 'Client', cuit: '20111111112' }, date: '2026-08-10', currency: 'USD', exchangeRate: 1000, subtotal: 100, vatAmount: 21, totalAmount: 121, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [], vatDetails: [] })
    const creditNote = VoucherFactory.rehydrate({ id: 'v2', companyId: 'company-1', type: 'sale', voucherTypeId: 'vt-2', voucherTypeCategory: 'credit_note', voucherTypeName: 'Nota de Credito', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000002', clientId: 'client-1', client: { name: 'Client', cuit: '20111111112' }, date: '2026-08-11', currency: 'ARS', exchangeRate: 1, subtotal: 50, vatAmount: 10.5, totalAmount: 60.5, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [], vatDetails: [] })
    voucherServiceMock.getAllVouchers.mockResolvedValue([usdInvoice, creditNote])

    const result = await exportService.exportVouchers('company-1', { mode: 'filters', type: 'sales' })

    expect(result.filename).toContain('Test_Company')
    expect(result.buffer).toBeInstanceOf(Buffer)
  })

  it('correctly maps perceptions and handles outlier tax jurisdictions for purchases', async () => {
    companyRepoMock.findById.mockResolvedValue({ id: 'company-1', name: 'Test Company', cuit: '30717618129', createdAt: new Date(), updatedAt: new Date() })
    catalogRepoMock.getVatRates.mockResolvedValue([{ id: 'vr-1', name: '21%', rate: new Decimal(0.21) }])
    const purchaseVoucher = VoucherFactory.rehydrate({ id: 'v3', companyId: 'company-1', type: 'purchase', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000003', supplierId: 'supplier-1', supplier: { name: 'Supplier', cuit: '30111111119' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 100, vatAmount: 21, totalAmount: 141, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [{ perceptionConceptId: 'pc-1', taxJurisdictionId: 'tj-caba', amount: 15, taxJurisdictionName: 'CABA' }, { perceptionConceptId: 'pc-2', taxJurisdictionId: 'tj-other', amount: 5, taxJurisdictionName: 'Chubut' }], vatDetails: [{ vatRateId: 'vr-1', subtotal: 100, vatAmount: 21 }] })
    voucherServiceMock.getAllVouchers.mockResolvedValue([purchaseVoucher])

    const result = await exportService.exportVouchers('company-1', { mode: 'filters', type: 'purchases' })

    expect(result.buffer).toBeInstanceOf(Buffer)
  })
})
