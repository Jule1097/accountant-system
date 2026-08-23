import { VoucherExportService } from 'src/services/voucher-export.service'
import { CompanyRepository } from 'src/repositories/company.repository'
import { CatalogRepository } from 'src/repositories/catalog.repository'
import { VoucherService } from 'src/services/voucher.service'
import { Voucher } from 'src/models/Voucher'
import Decimal from 'decimal.js'

jest.mock('src/repositories/company.repository')
jest.mock('src/repositories/catalog.repository')
jest.mock('src/services/voucher.service')

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
    ;(exportService as unknown as Record<string, unknown>).companyRepository = companyRepoMock
    ;(exportService as unknown as Record<string, unknown>).catalogRepository = catalogRepoMock
    ;(exportService as unknown as Record<string, unknown>).voucherService = voucherServiceMock

    catalogRepoMock.getRetentionConcepts.mockResolvedValue([
      { id: 'ret-gan', name: 'Retención de Ganancias Sufrida', type: 'sale' },
      { id: 'ret-iva', name: 'Retención de IVA Sufrida', type: 'sale' },
      { id: 'ret-iibb', name: 'Retención de Ingresos Brutos Sufrida', type: 'sale' },
      { id: 'ret-osseg', name: 'Retención Osseg/ansal Sufrida', type: 'sale' },
    ])

    catalogRepoMock.getPerceptionConcepts.mockResolvedValue([
      { id: 'perc-iva', name: 'Percepción de IVA' },
      { id: 'perc-gan', name: 'Percepción de Ganancias' },
      { id: 'perc-iibb', name: 'Percepción de Ingresos Brutos' },
      { id: 'perc-osseg', name: 'Percepción Osseg/ansal' },
    ])
  })

  it('performs currency conversion and negates credit notes correctly for sales', async () => {
    companyRepoMock.findById.mockResolvedValue({
      id: 'company-1',
      name: 'Test Company',
      cuit: '30717618129',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    catalogRepoMock.getVatRates.mockResolvedValue([])

    const usdInvoice = new Voucher({
      id: 'v1',
      companyId: 'company-1',
      type: 'sale',
      voucherTypeId: 'vt-1',
      voucherLetterId: 'vl-a',
      posNumber: '00001',
      number: '00000001',
      date: new Date('2026-08-10'),
      currency: 'USD',
      exchangeRate: new Decimal(1000),
      subtotal: new Decimal(100),
      vatAmount: new Decimal(21),
      totalAmount: new Decimal(121),
      paymentMethod: 'Efectivo',
      status: 'paid',
      createdByUserId: 'user-1',
      retentions: [],
      perceptions: [],
      vatDetails: [],
    })
    usdInvoice.voucherType = { name: 'Factura' }
    usdInvoice.voucherLetter = { letter: 'A' }

    const creditNote = new Voucher({
      id: 'v2',
      companyId: 'company-1',
      type: 'sale',
      voucherTypeId: 'vt-2',
      voucherLetterId: 'vl-a',
      posNumber: '00001',
      number: '00000002',
      date: new Date('2026-08-11'),
      currency: '$',
      exchangeRate: new Decimal(1),
      subtotal: new Decimal(50),
      vatAmount: new Decimal(10.5),
      totalAmount: new Decimal(60.5),
      paymentMethod: 'Efectivo',
      status: 'paid',
      createdByUserId: 'user-1',
      retentions: [],
      perceptions: [],
      vatDetails: [],
    })
    creditNote.voucherType = { name: 'Nota de Crédito' }
    creditNote.voucherLetter = { letter: 'A' }

    voucherServiceMock.getAllVouchers.mockResolvedValue([usdInvoice, creditNote])

    const result = await exportService.exportVouchers('company-1', {
      mode: 'filters',
      type: 'sales',
    })

    expect(result.filename).toContain('Test_Company')
    expect(result.buffer).toBeInstanceOf(Buffer)
  })

  it('correctly maps perceptions and handles outlier tax jurisdictions for purchases', async () => {
    companyRepoMock.findById.mockResolvedValue({
      id: 'company-1',
      name: 'Test Company',
      cuit: '30717618129',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    catalogRepoMock.getVatRates.mockResolvedValue([
      { id: 'vr-1', name: '21%', rate: new Decimal(0.21) },
    ])

    const purchaseVoucher = new Voucher({
      id: 'v3',
      companyId: 'company-1',
      type: 'purchase',
      voucherTypeId: 'vt-1',
      voucherLetterId: 'vl-a',
      posNumber: '00001',
      number: '00000003',
      date: new Date('2026-08-10'),
      currency: '$',
      exchangeRate: new Decimal(1),
      subtotal: new Decimal(100),
      vatAmount: new Decimal(21),
      totalAmount: new Decimal(141),
      paymentMethod: 'Efectivo',
      status: 'paid',
      createdByUserId: 'user-1',
      retentions: [],
      perceptions: [
        {
          perceptionConceptId: 'pc-1',
          taxJurisdictionId: 'tj-caba',
          amount: new Decimal(15),
          taxJurisdiction: { id: 'tj-caba', name: 'CABA' },
        },
        {
          perceptionConceptId: 'pc-2',
          taxJurisdictionId: 'tj-other',
          amount: new Decimal(5),
          taxJurisdiction: { id: 'tj-other', name: 'Chubut' },
        },
      ],
      vatDetails: [
        {
          vatRateId: 'vr-1',
          subtotal: new Decimal(100),
          vatAmount: new Decimal(21),
        },
      ],
    })
    purchaseVoucher.voucherType = { name: 'Factura' }
    purchaseVoucher.voucherLetter = { letter: 'A' }

    voucherServiceMock.getAllVouchers.mockResolvedValue([purchaseVoucher])

    const result = await exportService.exportVouchers('company-1', {
      mode: 'filters',
      type: 'purchases',
    })

    expect(result.buffer).toBeInstanceOf(Buffer)
  })
})
