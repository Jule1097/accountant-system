import prisma from 'src/lib/prisma'
import { Prisma } from 'src/generated/prisma/client'
import { Voucher } from 'src/models/Voucher'

export class VoucherRepository {
  async findById(companyId: string, id: string): Promise<Voucher | null> {
    const rawVoucher = await prisma.voucher.findUnique({
      where: { id, companyId },
      include: {
        retentions: {
          include: {
            retentionConcept: true,
            taxJurisdiction: true,
          },
        },
        perceptions: {
          include: {
            perceptionConcept: true,
            taxJurisdiction: true,
          },
        },
        vatDetails: {
          include: {
            vatRate: true,
          },
        },
        voucherType: true,
        voucherLetter: true,
        client: true,
        supplier: true,
      },
    })

    if (!rawVoucher) {
      return null
    }

    return new Voucher(rawVoucher)
  }

  async findDuplicate(voucher: Voucher): Promise<Voucher | null> {
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

    const rawVoucher = await prisma.voucher.findFirst({
      where: whereClause,
      include: {
        retentions: {
          include: {
            retentionConcept: true,
            taxJurisdiction: true,
          },
        },
        perceptions: {
          include: {
            perceptionConcept: true,
            taxJurisdiction: true,
          },
        },
        vatDetails: {
          include: {
            vatRate: true,
          },
        },
      },
    })

    if (!rawVoucher) {
      return null
    }

    return new Voucher(rawVoucher)
  }

  async findAll(companyId: string, filters: Record<string, unknown> = {}): Promise<Voucher[]> {
    const rawVouchers = await prisma.voucher.findMany({
      where: { companyId, ...filters },
      include: {
        retentions: {
          include: {
            retentionConcept: true,
            taxJurisdiction: true,
          },
        },
        perceptions: {
          include: {
            perceptionConcept: true,
            taxJurisdiction: true,
          },
        },
        vatDetails: {
          include: {
            vatRate: true,
          },
        },
        voucherType: true,
        voucherLetter: true,
        client: true,
        supplier: true,
      },
      orderBy: { date: 'desc' },
    })

    return rawVouchers.map((voucher) => new Voucher(voucher))
  }

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
      nonTaxableAmount: voucher.nonTaxableAmount,
      exemptAmount: voucher.exemptAmount,
      otherTaxesAmount: voucher.otherTaxesAmount,
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
        create: voucher.retentions.map((retention) => ({
          retentionConceptId: retention.retentionConceptId,
          taxJurisdictionId: retention.taxJurisdictionId,
          amount: retention.amount,
        })),
      },
      perceptions: {
        create: voucher.perceptions.map((perception) => ({
          perceptionConceptId: perception.perceptionConceptId,
          taxJurisdictionId: perception.taxJurisdictionId,
          amount: perception.amount,
        })),
      },
      vatDetails: {
        create: voucher.vatDetails.map((detail) => ({
          vatRateId: detail.vatRateId,
          subtotal: detail.subtotal,
          vatAmount: detail.vatAmount,
        })),
      },
    }

    const createdVoucher = await prisma.voucher.create({
      data,
      include: {
        retentions: {
          include: {
            retentionConcept: true,
            taxJurisdiction: true,
          },
        },
        perceptions: {
          include: {
            perceptionConcept: true,
            taxJurisdiction: true,
          },
        },
        vatDetails: {
          include: {
            vatRate: true,
          },
        },
      },
    })

    return new Voucher(createdVoucher)
  }

  async update(voucher: Voucher): Promise<Voucher> {
    if (!voucher.id) {
      throw new Error('Voucher ID is required for update')
    }

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
      nonTaxableAmount: voucher.nonTaxableAmount,
      exemptAmount: voucher.exemptAmount,
      otherTaxesAmount: voucher.otherTaxesAmount,
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
        create: voucher.retentions.map((retention) => ({
          retentionConceptId: retention.retentionConceptId,
          taxJurisdictionId: retention.taxJurisdictionId,
          amount: retention.amount,
        })),
      },
      perceptions: {
        deleteMany: {},
        create: voucher.perceptions.map((perception) => ({
          perceptionConceptId: perception.perceptionConceptId,
          taxJurisdictionId: perception.taxJurisdictionId,
          amount: perception.amount,
        })),
      },
      vatDetails: {
        deleteMany: {},
        create: voucher.vatDetails.map((detail) => ({
          vatRateId: detail.vatRateId,
          subtotal: detail.subtotal,
          vatAmount: detail.vatAmount,
        })),
      },
    }

    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucher.id, companyId: voucher.companyId },
      data,
      include: {
        retentions: {
          include: {
            retentionConcept: true,
            taxJurisdiction: true,
          },
        },
        perceptions: {
          include: {
            perceptionConcept: true,
            taxJurisdiction: true,
          },
        },
        vatDetails: {
          include: {
            vatRate: true,
          },
        },
      },
    })

    return new Voucher(updatedVoucher)
  }

  async delete(companyId: string, id: string): Promise<void> {
    await prisma.voucher.delete({
      where: { id, companyId },
    })
  }

  async findForAnalytics(companyId: string, startDate: Date) {
    return prisma.voucher.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
        },
      },
      include: {
        retentions: {
          include: {
            retentionConcept: true,
            taxJurisdiction: true,
          },
        },
        perceptions: {
          include: {
            perceptionConcept: true,
            taxJurisdiction: true,
          },
        },
        vatDetails: {
          include: {
            vatRate: true,
          },
        },
        voucherType: true,
        client: true,
        supplier: true,
      },
      orderBy: { date: 'desc' },
    })
  }
}
