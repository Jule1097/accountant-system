import { VoucherRepository } from 'src/repositories/voucher.repository'
import { Voucher } from 'src/models/Voucher'
import { VoucherFilterParams, VoucherListResponse, VoucherSummaryResponse } from 'src/types/voucher'

function resolveExplicitVoucherStatus(data: unknown): Voucher['status'] | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const status = (data as { status?: unknown }).status

  if (status === 'pending' || status === 'partial' || status === 'paid') {
    return status
  }

  return null
}

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
  ): Promise<VoucherListResponse> {
    return this.repository.findPage(companyId, page, pageSize, filters)
  }

  async getVoucherSummary(companyId: string, filters?: VoucherFilterParams): Promise<VoucherSummaryResponse> {
    return this.repository.summarize(companyId, filters)
  }

  async createVoucher(data: unknown): Promise<Voucher> {
    const voucher = new Voucher(data)
    const explicitStatus = resolveExplicitVoucherStatus(data)
    voucher.recalculate()
    voucher.status = explicitStatus || voucher.status

    const duplicate = await this.repository.findDuplicate(voucher)
    if (duplicate) {
      throw new Error('Voucher is a duplicate of an existing record')
    }

    return this.repository.create(voucher)
  }

  async updateVoucher(companyId: string, id: string, data: unknown): Promise<Voucher> {
    const existing = await this.repository.findById(companyId, id)
    if (!existing) {
      throw new Error('Voucher not found')
    }

    const updatedData = { ...existing, ...((data as Voucher) ?? {}) }
    updatedData.id = id

    const updatedVoucher = new Voucher(updatedData)
    const explicitStatus = resolveExplicitVoucherStatus(data)
    updatedVoucher.recalculate()
    updatedVoucher.status = explicitStatus || updatedVoucher.status

    const duplicate = await this.repository.findDuplicate(updatedVoucher)
    if (duplicate && duplicate.id !== id) {
      throw new Error('Voucher is a duplicate of an existing record')
    }

    return this.repository.update(updatedVoucher)
  }

  async deleteVoucher(companyId: string, id: string): Promise<void> {
    const existing = await this.repository.findById(companyId, id)
    if (!existing) {
      throw new Error('Voucher not found')
    }

    return this.repository.delete(companyId, id)
  }
}
