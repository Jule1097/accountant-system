import { VoucherRepository } from 'src/repositories/voucher/voucher.repository'
import { VoucherFactory } from 'src/models/voucher/VoucherFactory'
import { Voucher } from 'src/models/voucher/Voucher'
import { VoucherFactoryInput } from 'src/types/voucher/domain'
import { VoucherFilterParams, VoucherListResponse, VoucherSummaryResponse } from 'src/types/voucher/voucher'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { applicationErrorCodes } from 'src/lib/constants/application-error'
import { ApplicationError } from 'src/lib/errors/application-error'
import { supplierTaxIdentificationModes } from 'src/lib/constants/third-party'
import { voucherDocumentIdentificationModes, purchaseIdentificationModeMismatchMessage, purchaseSupplierNotFoundMessage, voucherTypeNotApplicableMessage, voucherTypeValues } from 'src/lib/constants/voucher'
import { SupplierRepositoryContract } from 'src/types/third-party/supplier-repository'
import { IdentificationModeConversionRequiredError, PossibleNonFiscalDuplicateError } from 'src/lib/errors/voucher/voucher-errors'

export class VoucherService {
  private repository: VoucherRepository
  private supplierRepository?: SupplierRepositoryContract

  constructor(repository: VoucherRepository = new VoucherRepository(), supplierRepository?: SupplierRepositoryContract) {
    this.repository = repository
    this.supplierRepository = supplierRepository
  }

  async getVoucherById(companyId: string, id: string): Promise<Voucher | null> {
    return this.repository.findById(companyId, id)
  }

  async getAllVouchers(companyId: string, filters?: VoucherFilterParams): Promise<Voucher[]> {
    return this.repository.findAll(companyId, filters)
  }

  async getVoucherPage(
    companyId: string,
    page: number,
    pageSize: number,
    filters?: VoucherFilterParams
  ): Promise<VoucherListResponse<Voucher>> {
    return this.repository.findPage(companyId, page, pageSize, filters)
  }

  async getVoucherSummary(companyId: string, filters?: VoucherFilterParams): Promise<VoucherSummaryResponse> {
    return this.repository.summarize(companyId, filters)
  }

  async createVoucher(input: VoucherFactoryInput): Promise<Voucher> {
    const resolvedInput = await this.resolvePurchaseIdentificationMode(input)
    const isApplicable = await this.repository.isVoucherTypeApplicable(resolvedInput.voucherTypeId, resolvedInput.type as 'sale' | 'purchase')
    if (isApplicable === false) throw new ApplicationError(applicationErrorCodes.validation, voucherTypeNotApplicableMessage, 'Voucher type is not applicable to the selected workflow')
    const voucher = VoucherFactory.create(resolvedInput)

    const duplicate = await this.repository.findDuplicate(voucher)
    if (duplicate && this.isPossibleNonFiscalDuplicate(voucher) && !input.confirmNonFiscalDuplicate) {
      throw new PossibleNonFiscalDuplicateError()
    }
    if (duplicate && !this.isPossibleNonFiscalDuplicate(voucher)) {
      throw new ApplicationError(applicationErrorCodes.duplicate, apiResponseMessages.voucher.duplicate, 'Duplicate voucher detected')
    }

    return this.repository.create(voucher)
  }

  async updateVoucher(companyId: string, id: string, input: VoucherFactoryInput): Promise<Voucher> {
    const existing = await this.repository.findById(companyId, id)
    if (!existing) {
      throw new ApplicationError(applicationErrorCodes.notFound, apiResponseMessages.voucher.notFoundWithPeriod, 'Voucher not found')
    }

    const resolvedInput = await this.resolvePurchaseIdentificationMode({ ...input, companyId, id }, existing)
    const isApplicable = await this.repository.isVoucherTypeApplicable(resolvedInput.voucherTypeId, resolvedInput.type as 'sale' | 'purchase')
    if (isApplicable === false) throw new ApplicationError(applicationErrorCodes.validation, voucherTypeNotApplicableMessage, 'Voucher type is not applicable to the selected workflow')
    const updatedVoucher = VoucherFactory.create(resolvedInput)

    const duplicate = await this.repository.findDuplicate(updatedVoucher)
    if (duplicate && duplicate.id !== id && this.isPossibleNonFiscalDuplicate(updatedVoucher) && !input.confirmNonFiscalDuplicate) {
      throw new PossibleNonFiscalDuplicateError()
    }
    if (duplicate && duplicate.id !== id && !this.isPossibleNonFiscalDuplicate(updatedVoucher)) {
      throw new ApplicationError(applicationErrorCodes.duplicate, apiResponseMessages.voucher.duplicate, 'Duplicate voucher detected')
    }

    return this.repository.update(updatedVoucher)
  }

  async deleteVoucher(companyId: string, id: string): Promise<void> {
    const existing = await this.repository.findById(companyId, id)
    if (!existing) {
      throw new ApplicationError(applicationErrorCodes.notFound, apiResponseMessages.voucher.notFoundWithPeriod, 'Voucher not found')
    }

    return this.repository.delete(companyId, id)
  }

  private isPossibleNonFiscalDuplicate(voucher: Voucher): boolean {
    return voucher.type === 'purchase' && voucher.documentIdentificationMode === voucherDocumentIdentificationModes.nonFiscal
  }

  private async resolvePurchaseIdentificationMode(input: VoucherFactoryInput, existing?: Voucher): Promise<VoucherFactoryInput> {
    if (input.type !== 'purchase' || !input.supplierId) return input

    if (!this.supplierRepository) return input
    const supplier = await this.supplierRepository.findById(input.companyId, input.supplierId)
    if (!supplier) throw new ApplicationError(applicationErrorCodes.validation, purchaseSupplierNotFoundMessage, 'Purchase supplier was not found in the company scope')
    const supplierMode = supplier.taxIdentificationMode === supplierTaxIdentificationModes.withoutCuit ? voucherDocumentIdentificationModes.nonFiscal : voucherDocumentIdentificationModes.fiscal
    const keepsHistoricalMode = existing?.type === 'purchase' && existing.getPartyId() === input.supplierId
    const requestedMode = keepsHistoricalMode ? existing.documentIdentificationMode : supplierMode
    const changesMode = !!existing && !keepsHistoricalMode && existing.documentIdentificationMode !== supplierMode
    const mismatchedCreateMode = !existing && !!input.documentIdentificationMode && input.documentIdentificationMode !== supplierMode
    if (changesMode && !input.confirmIdentificationModeConversion) throw new IdentificationModeConversionRequiredError()
    if (mismatchedCreateMode) throw new ApplicationError(applicationErrorCodes.validation, purchaseIdentificationModeMismatchMessage, 'Purchase identification mode does not match supplier tax identification mode')
    const fiscalFields = requestedMode === voucherDocumentIdentificationModes.nonFiscal ? { voucherLetterId: null, posNumber: null, number: null } : {}
    return { ...input, ...fiscalFields, type: voucherTypeValues.purchase, documentIdentificationMode: requestedMode }
  }
}
