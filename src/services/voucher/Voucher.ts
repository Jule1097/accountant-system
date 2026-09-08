import { VoucherRepository } from 'src/repositories/voucher/voucher.repository'
import { VoucherFactory } from 'src/models/voucher/VoucherFactory'
import { Voucher } from 'src/models/voucher/Voucher'
import { VoucherFactoryInput } from 'src/types/voucher/domain'
import { VoucherFilterParams, VoucherListResponse, VoucherSummaryResponse } from 'src/types/voucher/voucher'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { applicationErrorCodes } from 'src/lib/constants/application-error'
import { ApplicationError } from 'src/lib/errors/application-error'

export class VoucherService {
  private repository: VoucherRepository

  constructor() {
    this.repository = new VoucherRepository()
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
    const voucher = VoucherFactory.create(input)

    const duplicate = await this.repository.findDuplicate(voucher)
    if (duplicate) {
      throw new ApplicationError(applicationErrorCodes.duplicate, apiResponseMessages.voucher.duplicate, 'Duplicate voucher detected')
    }

    return this.repository.create(voucher)
  }

  async updateVoucher(companyId: string, id: string, input: VoucherFactoryInput): Promise<Voucher> {
    const existing = await this.repository.findById(companyId, id)
    if (!existing) {
      throw new ApplicationError(applicationErrorCodes.notFound, apiResponseMessages.voucher.notFoundWithPeriod, 'Voucher not found')
    }

    const updatedVoucher = VoucherFactory.create({ ...input, companyId, id })

    const duplicate = await this.repository.findDuplicate(updatedVoucher)
    if (duplicate && duplicate.id !== id) {
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
}
