import { VoucherRepository } from 'src/repositories/voucher.repository'
import { Voucher } from 'src/models/Voucher'
import { VoucherFilterParams } from 'src/types/voucher'

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

  async createVoucher(data: unknown): Promise<Voucher> {
    const voucher = new Voucher(data)

    voucher.recalculate()

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

    const updatedData = { ...existing, ...(data as Voucher ?? {}) }
    updatedData.id = id

    const updatedVoucher = new Voucher(updatedData)
    updatedVoucher.recalculate()

    const duplicate = await this.repository.findDuplicate(updatedVoucher)
    if (duplicate && duplicate.id !== id) {
      throw new Error('Voucher is a duplicate of an existing record')
    }

    return this.repository.update(updatedVoucher)
  }

  async deleteVoucher(companyId: string, id: string): Promise<void> {
    return this.repository.delete(companyId, id)
  }
}
