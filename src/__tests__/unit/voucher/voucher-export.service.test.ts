import Decimal from 'decimal.js'
import { CatalogRepository } from 'src/repositories/catalog/catalog.repository'
import { CompanyRepository } from 'src/repositories/company/company.repository'
import { VoucherFactory } from 'src/models/voucher/VoucherFactory'
import { VoucherService } from 'src/services/voucher/Voucher'
import { VoucherExportService } from 'src/services/voucher/VoucherExport'
import { mapSalesVoucherToRow, prepareExportWorkbookData } from 'src/lib/helpers/voucher/voucher-export'
import { Sale } from 'src/models/voucher/Sale'
import { buildExcelWorkbook } from 'src/lib/helpers/platform/excel-builder'
import { mapPrismaVoucherToDomainInput } from 'src/lib/helpers/voucher/voucher-persistence'

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
    catalogRepoMock.getRetentionConcepts.mockResolvedValue([{ id: 'ret-gan', name: 'Retencion de Ganancias Sufrida' }, { id: 'ret-iva', name: 'Retencion de IVA Sufrida' }])
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

  it('exports date-only values as Excel dates without filtering retention concepts by applicability', () => {
    const sale = VoucherFactory.rehydrate({ id: 'v4', companyId: 'company-1', type: 'sale', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000004', clientId: 'client-1', client: { name: 'Client', cuit: '20111111112' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 100, vatAmount: 21, totalAmount: 121, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [{ retentionConceptId: 'ret-iibb', amount: 10, taxJurisdictionName: 'CABA' }, { retentionConceptId: 'ret-gan', amount: 15 }], perceptions: [], vatDetails: [] }) as Sale
    const catalogs = {
      allVatRates: [],
      allRetentionConcepts: [{ id: 'ret-iibb', name: 'Retención de IIBB' }, { id: 'ret-gan', name: 'Retención de Ganancias' }],
      allPerceptionConcepts: [],
    }

    const { columns, data } = prepareExportWorkbookData('sales', [sale], catalogs)

    expect(data[0].date).toEqual(expect.any(Date))
    expect(columns.some((column) => column.key === 'ret_concept_ret-iibb')).toBe(false)
    expect(data[0]['ret_CABA']).toBe(-10)
    expect(data[0]['ret_concept_ret-iibb']).toBe(0)
    expect(data[0]['ret_concept_ret-gan']).toBe(-15)
  })

  it('exports IIBB perceptions by jurisdiction and non-IIBB perceptions by concept', () => {
    const purchase = VoucherFactory.rehydrate({ id: 'v10', companyId: 'company-1', type: 'purchase', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000010', supplierId: 'supplier-1', supplier: { name: 'Supplier', cuit: '30111111119' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 100, vatAmount: 21, totalAmount: 163, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [{ perceptionConceptId: 'perc-iibb', amount: 15, taxJurisdictionName: 'CABA' }, { perceptionConceptId: 'perc-iibb', amount: 25, taxJurisdictionName: 'Cordoba' }, { perceptionConceptId: 'perc-gan', amount: 7 }], vatDetails: [] })
    const { data } = prepareExportWorkbookData('purchases', [purchase], {
      allVatRates: [],
      allRetentionConcepts: [],
      allPerceptionConcepts: [{ id: 'perc-iibb', name: 'Percepción de IIBB' }, { id: 'perc-gan', name: 'Percepción de Ganancias' }],
    })

    expect(data[0]['perc_CABA']).toBe(15)
    expect(data[0]['perc_Cordoba']).toBe(25)
    expect(data[0]['perc_concept_perc-iibb']).toBe(0)
    expect(data[0]['perc_concept_perc-gan']).toBe(7)
  })

  it('exports purchase columns and values only for configured IIBB jurisdictions and VAT rates', () => {
    const purchase = VoucherFactory.rehydrate({ id: 'v11', companyId: 'company-1', type: 'purchase', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000011', supplierId: 'supplier-1', supplier: { name: 'Supplier', cuit: '30111111119' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 180, vatAmount: 27.85, totalAmount: 237.85, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [{ perceptionConceptId: 'perc-iibb', amount: 15, taxJurisdictionName: 'CABA' }, { perceptionConceptId: 'perc-iibb', amount: 20, taxJurisdictionName: 'Buenos Aires' }, { perceptionConceptId: 'perc-iibb', amount: 25, taxJurisdictionName: 'Cordoba' }], vatDetails: [{ vatRateId: 'vr-21', subtotal: 100, vatAmount: 21 }, { vatRateId: 'vr-105', subtotal: 50, vatAmount: 5.25 }, { vatRateId: 'vr-3', subtotal: 20, vatAmount: 0.6 }] })
    const { columns, data } = prepareExportWorkbookData('purchases', [purchase], {
      allVatRates: [
        { id: 'vr-21', name: '21%', rate: new Decimal(0.21) },
        { id: 'vr-105', name: '10.5%', rate: new Decimal(0.105) },
        { id: 'vr-3', name: '3%', rate: new Decimal(0.03) },
        { id: 'vr-27', name: '27%', rate: new Decimal(0.27) },
      ],
      allRetentionConcepts: [],
      allPerceptionConcepts: [{ id: 'perc-iibb', name: 'Percepción de IIBB' }],
    })

    const columnKeys = columns.map((column) => column.key)

    expect(columnKeys).toEqual(expect.arrayContaining(['iva_vr-21', 'iva_vr-105', 'iva_vr-3', 'perc_CABA', 'perc_Buenos Aires', 'perc_Cordoba']))
    expect(columnKeys).not.toContain('iva_vr-27')
    expect(columnKeys).not.toContain('perc_Tucuman')
    expect(data[0]['iva_vr-21']).toBe(21)
    expect(data[0]['iva_vr-105']).toBe(5.25)
    expect(data[0]['iva_vr-3']).toBe(0.6)
    expect(data[0]['iva_vr-27']).toBeUndefined()
    expect(data[0]['perc_CABA']).toBe(15)
    expect(data[0]['perc_Buenos Aires']).toBe(20)
    expect(data[0]['perc_Cordoba']).toBe(25)
  })

  it('merges the authoritative exempt VAT detail into purchase subtotal and omits exempt and OSSEG columns', () => {
    const purchase = VoucherFactory.rehydrate({ id: 'v5', companyId: 'company-1', type: 'purchase', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000005', supplierId: 'supplier-1', supplier: { name: 'Supplier', cuit: '30111111119' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 100, vatAmount: 0, exemptAmount: 5, totalAmount: 105, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [], vatDetails: [{ vatRateId: 'vat-exempt', subtotal: 8, vatAmount: 0 }] })
    const { columns, data } = prepareExportWorkbookData('purchases', [purchase], {
      allVatRates: [{ id: 'vat-exempt', name: 'Exento', rate: new Decimal(0) }],
      allRetentionConcepts: [],
      allPerceptionConcepts: [
        { id: 'perc-iibb', name: 'Percepción de IIBB' },
        { id: 'perc-osseg', name: 'Percepción OSSEG/ANSAL' },
      ],
    })

    expect(data[0].date).toEqual(expect.any(Date))
    expect(data[0].subtotal).toBe(108)
    expect(columns.some((column) => column.key === 'exempt')).toBe(false)
    expect(columns.some((column) => column.key === 'perc_concept_perc-osseg')).toBe(false)
    expect(columns.some((column) => column.key === 'perc_concept_perc-iibb')).toBe(false)
  })

  it('merges exempt amounts into letter C purchase subtotals', () => {
    const purchase = VoucherFactory.rehydrate({ id: 'v9', companyId: 'company-1', type: 'purchase', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-c', voucherLetter: 'C', posNumber: '00001', number: '00000009', supplierId: 'supplier-1', supplier: { name: 'Supplier', cuit: '30111111119' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 40, vatAmount: 0, exemptAmount: 6, totalAmount: 46, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [], vatDetails: [] })
    const { data } = prepareExportWorkbookData('purchases', [purchase], {
      allVatRates: [],
      allRetentionConcepts: [],
      allPerceptionConcepts: [],
    })

    expect(data[0].subtotal).toBe(46)
  })

  it('formats exported date columns as Excel dates', () => {
    const workbook = buildExcelWorkbook('Export', 'Company', '30111111119', 'Filter', [{ header: 'Fecha', key: 'date', isDate: true }], [{ date: new Date(Date.UTC(2026, 7, 10)) }])
    const cell = workbook.worksheets[0].getRow(7).getCell(1)

    expect(cell.value).toEqual(expect.any(Date))
    expect(cell.numFmt).toBe('dd/mm/yyyy')
  })

  it('keeps standard amounts positive while credit notes and sales retentions remain subtractive', () => {
    const creditNote = VoucherFactory.rehydrate({ id: 'v6', companyId: 'company-1', type: 'sale', voucherTypeId: 'vt-credit', voucherTypeCategory: 'credit_note', voucherTypeName: 'Nota de Crédito', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000006', clientId: 'client-1', client: { name: 'Client', cuit: '20111111112' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 100, vatAmount: 21, otherTaxesAmount: 4, totalAmount: 125, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [{ retentionConceptId: 'ret-iva', amount: 10 }], perceptions: [], vatDetails: [] }) as Sale
    const standard = VoucherFactory.rehydrate(mapPrismaVoucherToDomainInput({
      id: 'v7',
      companyId: 'company-1',
      type: 'sale',
      voucherTypeId: 'vt-mipyme',
      voucherLetterId: 'vl-a',
      posNumber: '00001',
      number: '00000007',
      clientId: 'client-1',
      supplierId: null,
      date: new Date('2026-08-10T00:00:00.000Z'),
      accountingPeriod: new Date('2026-08-01T00:00:00.000Z'),
      currency: 'ARS',
      exchangeRate: new Decimal('1.0000'),
      subtotal: new Decimal('100.00'),
      vatAmount: new Decimal('21.00'),
      nonTaxableAmount: new Decimal('0.00'),
      exemptAmount: new Decimal('0.00'),
      otherTaxesAmount: new Decimal('4.00'),
      totalAmount: new Decimal('125.00'),
      netAmount: new Decimal('125.00'),
      concept: null,
      paymentMethod: 'Efectivo',
      status: 'paid',
      paymentDate: null,
      paidAmount: new Decimal('0.00'),
      comments: null,
      createdByUserId: 'user-1',
      createdAt: new Date('2026-08-10T00:00:00.000Z'),
      updatedAt: new Date('2026-08-10T00:00:00.000Z'),
      retentions: [],
      perceptions: [],
      vatDetails: [],
      voucherType: { name: 'Factura de Crédito Electrónica MiPyME' },
      voucherLetter: { letter: 'A' },
      client: { name: 'Client', cuit: '20111111112' },
      supplier: null,
    })) as Sale
    const concepts = [{ id: 'ret-iva', name: 'Retención de IVA' }]

    const creditRow = mapSalesVoucherToRow(creditNote, concepts)
    const standardRow = mapSalesVoucherToRow(standard, concepts)

    expect(creditRow.subtotal).toBe(-100)
    expect(creditRow.vat).toBe(-21)
    expect(creditRow['ret_concept_ret-iva']).toBe(-10)
    expect(standardRow.subtotal).toBe(100)
    expect(standardRow.vat).toBe(21)
    expect(creditRow.otherTaxes).toBeUndefined()
    expect(standardRow.otherTaxes).toBeUndefined()

    const { columns } = prepareExportWorkbookData('sales', [creditNote, standard], {
      allVatRates: [],
      allRetentionConcepts: concepts,
      allPerceptionConcepts: [],
    })

    expect(columns.some((column) => column.key === 'otherTaxes')).toBe(false)
  })

  it('merges generic purchase taxes and unmapped perceptions into the Otros Impuestos concept', () => {
    const purchase = VoucherFactory.rehydrate({ id: 'v12', companyId: 'company-1', type: 'purchase', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000012', supplierId: 'supplier-1', supplier: { name: 'Supplier', cuit: '30111111119' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 100, vatAmount: 21, otherTaxesAmount: 4, totalAmount: 131, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [{ perceptionConceptId: 'perc-other', amount: 6 }, { perceptionConceptId: 'perc-iibb', amount: 3, taxJurisdictionName: 'Tucuman' }], vatDetails: [] })
    const { columns, data } = prepareExportWorkbookData('purchases', [purchase], {
      allVatRates: [],
      allRetentionConcepts: [],
      allPerceptionConcepts: [
        { id: 'perc-other', name: 'Otros Impuestos' },
        { id: 'perc-iibb', name: 'Percepción de IIBB' },
      ],
    })

    expect(columns.some((column) => column.key === 'perc_concept_perc-other')).toBe(true)
    expect(columns.some((column) => column.key === 'otherPerceptions')).toBe(false)
    expect(data[0]['perc_concept_perc-other']).toBe(13)
    expect(data[0].otherPerceptions).toBeUndefined()
  })

  it('stores populated voucher and payment dates as date cells and keeps empty payment dates empty', async () => {
    const sale = VoucherFactory.rehydrate({ id: 'v8', companyId: 'company-1', type: 'sale', voucherTypeId: 'vt-1', voucherTypeName: 'Factura', voucherLetterId: 'vl-a', voucherLetter: 'A', posNumber: '00001', number: '00000008', clientId: 'client-1', client: { name: 'Client', cuit: '20111111112' }, date: '2026-08-10', currency: 'ARS', exchangeRate: 1, subtotal: 100, vatAmount: 21, totalAmount: 121, paymentDate: null, paymentMethod: 'Efectivo', status: 'paid', createdByUserId: 'user-1', retentions: [], perceptions: [], vatDetails: [] }) as Sale
    const row = mapSalesVoucherToRow(sale, [])

    expect(row.date).toEqual(expect.any(Date))
    expect(row.paymentDate).toBeNull()
  })
})
