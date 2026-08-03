import prisma from 'src/lib/prisma'
import { Prisma } from 'src/generated/prisma/client'
import { Voucher } from 'src/models/Voucher'

export class VoucherRepository {
  // Queries
  async findById(companyId: string, id: string): Promise<Voucher | null> {
    const raw = await prisma.voucher.findUnique({
      where: { id, companyId },
      include: {
        retentions: true,
        vatDetails: true,
      },
    })

    if (!raw) return null
    return new Voucher(raw)
  }

  async findDuplicate(voucher: Voucher): Promise<Voucher | null> {
    // Exact combination of company, type, third-party, voucher type, letter, posNumber, number
    const whereClause: Record<string, unknown> = {
      companyId: voucher.companyId,
      type: voucher.type,
      voucherTypeId: voucher.voucherTypeId,
      voucherLetterId: voucher.voucherLetterId,
      posNumber: voucher.posNumber,
      number: voucher.number,
    }

    if (voucher.type === 'sale') {
      whereClause.clientId = voucher.clientId
    } else {
      whereClause.supplierId = voucher.supplierId
    }

    const raw = await prisma.voucher.findFirst({
      where: whereClause,
      include: {
        retentions: true,
        vatDetails: true,
      },
    })

    if (!raw) return null
    return new Voucher(raw)
  }

  async findAll(companyId: string, filters: Record<string, unknown> = {}): Promise<Voucher[]> {
    const raw = await prisma.voucher.findMany({
      where: { companyId, ...filters },
      include: {
        retentions: true,
        vatDetails: true,
      },
      orderBy: { date: 'desc' },
    })

    return raw.map(r => new Voucher(r))
  }

  // Persists a new Voucher
  async create(voucher: Voucher): Promise<Voucher> {
    const data: Prisma.VoucherUncheckedCreateInput = {
      companyId: voucher.companyId,
      type: voucher.type,
      voucherTypeId: voucher.voucherTypeId,
      voucherLetterId: voucher.voucherLetterId,
      posNumber: voucher.posNumber,
      number: voucher.number,
      clientId: voucher.clientId,
      supplierId: voucher.supplierId,
      date: voucher.date,
      accountingPeriod: voucher.accountingPeriod,
      currency: voucher.currency,
      exchangeRate: voucher.exchangeRate,
      subtotal: voucher.subtotal,
      vatAmount: voucher.vatAmount,
      totalAmount: voucher.totalAmount,
      netAmount: voucher.netAmount,
      concept: voucher.concept,
      paymentMethod: voucher.paymentMethod,
      status: voucher.status,
      paymentDate: voucher.paymentDate,
      paidAmount: voucher.paidAmount,
      comments: voucher.comments,
      createdByUserId: voucher.createdByUserId,
      retentions: {
        create: voucher.retentions.map(r => ({
          retentionConceptId: r.retentionConceptId,
          amount: r.amount,
          province: r.province,
        }))
      },
      vatDetails: {
        create: voucher.vatDetails.map(v => ({
          vatRateId: v.vatRateId,
          subtotal: v.subtotal,
          vatAmount: v.vatAmount,
        }))
      }
    }

    const created = await prisma.voucher.create({
      data,
      include: {
        retentions: true,
        vatDetails: true,
      }
    })

    return new Voucher(created)
  }

  // Update existing Voucher
  async update(voucher: Voucher): Promise<Voucher> {
    if (!voucher.id) throw new Error('Voucher ID is required for update')

    const data: Prisma.VoucherUncheckedUpdateInput = {
      type: voucher.type,
      voucherTypeId: voucher.voucherTypeId,
      voucherLetterId: voucher.voucherLetterId,
      posNumber: voucher.posNumber,
      number: voucher.number,
      clientId: voucher.clientId,
      supplierId: voucher.supplierId,
      date: voucher.date,
      accountingPeriod: voucher.accountingPeriod,
      currency: voucher.currency,
      exchangeRate: voucher.exchangeRate,
      subtotal: voucher.subtotal,
      vatAmount: voucher.vatAmount,
      totalAmount: voucher.totalAmount,
      netAmount: voucher.netAmount,
      concept: voucher.concept,
      paymentMethod: voucher.paymentMethod,
      status: voucher.status,
      paymentDate: voucher.paymentDate,
      paidAmount: voucher.paidAmount,
      comments: voucher.comments,
      retentions: {
        deleteMany: {},
        create: voucher.retentions.map(r => ({
          retentionConceptId: r.retentionConceptId,
          amount: r.amount,
          province: r.province,
        }))
      },
      vatDetails: {
        deleteMany: {},
        create: voucher.vatDetails.map(v => ({
          vatRateId: v.vatRateId,
          subtotal: v.subtotal,
          vatAmount: v.vatAmount,
        }))
      }
    }

    const updated = await prisma.voucher.update({
      where: { id: voucher.id, companyId: voucher.companyId },
      data,
      include: {
        retentions: true,
        vatDetails: true,
      }
    })

    return new Voucher(updated)
  }

  async delete(companyId: string, id: string): Promise<void> {
    await prisma.voucher.delete({
      where: { id, companyId }
    })
  }
}
