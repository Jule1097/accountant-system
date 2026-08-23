import { CompanyRepository } from 'src/repositories/company.repository'
import { CatalogRepository } from 'src/repositories/catalog.repository'
import { VoucherService } from './voucher.service'
import { buildExcelWorkbook } from 'src/lib/helpers/excel-builder'
import { normalizeCuit } from 'src/lib/cuit'
import {
  buildExportFilters,
  prepareExportWorkbookData,
  generateExportFilename,
} from 'src/lib/helpers/voucher-export'
import {
  ExportQueryParams,
  VoucherExportResult,
} from 'src/types/voucher-export'

export class VoucherExportService {
  private companyRepository: CompanyRepository
  private catalogRepository: CatalogRepository
  private voucherService: VoucherService

  constructor() {
    this.companyRepository = new CompanyRepository()
    this.catalogRepository = new CatalogRepository()
    this.voucherService = new VoucherService()
  }

  async exportVouchers(companyId: string, params: ExportQueryParams): Promise<VoucherExportResult> {
    const company = await this.companyRepository.findById(companyId)
    if (!company) {
      throw new Error('Company not found')
    }

    const { filters, periodString } = buildExportFilters(params)

    const vouchers = await this.voucherService.getAllVouchers(companyId, filters)
    const allVatRates = await this.catalogRepository.getVatRates()
    const allRetentionConcepts = await this.catalogRepository.getRetentionConcepts()
    const allPerceptionConcepts = await this.catalogRepository.getPerceptionConcepts()

    const { columns, data } = prepareExportWorkbookData(params.type, vouchers, {
      allVatRates,
      allRetentionConcepts,
      allPerceptionConcepts,
    })

    const titleText = params.type === 'sales' ? 'Libro IVA Ventas' : 'Libro IVA Compras'
    const subTitleText = params.mode === 'declaration' ? `Período: ${periodString}` : 'Filtro: Vista Actual'
    const companyCuit = company.cuit ? normalizeCuit(company.cuit) : ''

    const workbook = buildExcelWorkbook(
      titleText,
      company.name,
      companyCuit,
      subTitleText,
      columns,
      data
    )

    const filename = generateExportFilename(params, company.name, periodString)
    const excelBuffer = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(excelBuffer as ArrayBuffer)

    return {
      filename,
      buffer,
    }
  }
}
