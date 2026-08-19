import prisma from 'src/lib/prisma'
import { Prisma } from 'src/generated/prisma/client'
import { Voucher } from 'src/models/Voucher'
import { GeminiParserResponse } from 'src/types/gemini-parser'
import {
  VoucherFilterParams,
  VoucherListItem,
  VoucherListResponse,
  VoucherRecordType,
  VoucherSortOrder,
  VoucherSummaryResponse,
} from 'src/types/voucher'

const voucherInclude = {
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
} satisfies Prisma.VoucherInclude

interface VoucherSummaryRawRecord {
  totalAmount: Prisma.Decimal
  client: { name: string; cuit: string } | null
  supplier: { name: string; cuit: string } | null
}

function resolveVoucherDateFilter(filters: VoucherFilterParams): Prisma.DateTimeFilter<'Voucher'> | undefined {
  if (!filters.dateFrom || !filters.dateTo) {
    return undefined
  }

  const startDate = new Date(filters.dateFrom)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(filters.dateTo)
  endDate.setHours(23, 59, 59, 999)

  return {
    gte: startDate,
    lte: endDate,
  }
}

function resolveVoucherSearchWhere(search: string, type: VoucherRecordType): Prisma.VoucherWhereInput[] {
  const normalizedSearch = search.trim()
  const normalizedDigits = normalizedSearch.replace(/\D/g, '')
  const [posNumberPart, numberPart] = normalizedSearch.split('-')
  const partyKey = type === 'sale' ? 'client' : 'supplier'
  const partyConditions: Prisma.VoucherWhereInput[] = [
    {
      [partyKey]: {
        is: {
          name: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
      },
    },
    {
      [partyKey]: {
        is: {
          cuit: {
            contains: normalizedSearch,
          },
        },
      },
    },
  ]
  const voucherConditions: Prisma.VoucherWhereInput[] = [
    {
      posNumber: {
        contains: normalizedSearch,
      },
    },
    {
      number: {
        contains: normalizedSearch,
      },
    },
  ]

  if (posNumberPart && numberPart) {
    voucherConditions.push({
      AND: [
        {
          posNumber: {
            contains: posNumberPart,
          },
        },
        {
          number: {
            contains: numberPart,
          },
        },
      ],
    })
  }

  if (normalizedDigits.length > 5) {
    voucherConditions.push({
      AND: [
        {
          posNumber: {
            contains: normalizedDigits.slice(0, 5),
          },
        },
        {
          number: {
            contains: normalizedDigits.slice(5),
          },
        },
      ],
    })
  }

  return [...partyConditions, ...voucherConditions]
}

function resolveVoucherOrderBy(sortBy: string | undefined, sortOrder: VoucherSortOrder | undefined): Prisma.VoucherOrderByWithRelationInput[] {
  const direction = sortOrder || 'desc'

  if (sortBy === 'status') {
    return [{ status: direction }, { date: 'desc' }]
  }

  if (sortBy === 'voucher') {
    return [
      { voucherLetter: { letter: direction } },
      { posNumber: direction },
      { number: direction },
    ]
  }

  return [{ date: direction }]
}

function mapVoucherListItem(rawVoucher: Prisma.VoucherGetPayload<{ include: typeof voucherInclude }>): VoucherListItem {
  const voucher = new Voucher(rawVoucher)
  const party = voucher.type === 'sale' ? voucher.client : voucher.supplier

  return {
    rowKey: rawVoucher.id,
    voucher,
    composedVoucherId: `${voucher.voucherLetter?.letter || ''} ${voucher.posNumber}-${voucher.number}`.trim(),
    partyName: party?.name || null,
    partyCuit: party?.cuit || null,
  }
}

function buildVoucherWhereClause(companyId: string, filters: VoucherFilterParams = {}): Prisma.VoucherWhereInput {
  const whereClause: Prisma.VoucherWhereInput = {
    companyId,
    date: resolveVoucherDateFilter(filters),
  }

  if (filters.type) {
    whereClause.type = filters.type
  }

  if (filters.status) {
    whereClause.status = filters.status
  }

  if (filters.search && filters.type) {
    whereClause.OR = resolveVoucherSearchWhere(filters.search, filters.type)
  }

  return whereClause
}

export class VoucherRepository {
  async findById(companyId: string, id: string): Promise<Voucher | null> {
    const rawVoucher = await prisma.voucher.findUnique({
      where: { id, companyId },
      include: voucherInclude,
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
      include: voucherInclude,
    })

    if (!rawVoucher) {
      return null
    }

    return new Voucher(rawVoucher)
  }

  async findDuplicateByParsedPayload(
    companyId: string,
    type: VoucherRecordType,
    parsedPayload: GeminiParserResponse
  ): Promise<Voucher | null> {
    if (!parsedPayload.thirdPartyId || !parsedPayload.voucherType || !parsedPayload.voucherLetter || !parsedPayload.posNumber || !parsedPayload.number) {
      return null
    }

    const whereClause: Prisma.VoucherWhereInput = {
      companyId,
      type,
      voucherType: {
        name: {
          equals: parsedPayload.voucherType,
          mode: 'insensitive',
        },
      },
      voucherLetter: {
        letter: {
          equals: parsedPayload.voucherLetter.toUpperCase(),
        },
      },
      posNumber: parsedPayload.posNumber.padStart(5, '0'),
      number: parsedPayload.number.padStart(8, '0'),
      clientId: type === 'sale' ? parsedPayload.thirdPartyId : undefined,
      supplierId: type === 'purchase' ? parsedPayload.thirdPartyId : undefined,
    }

    const rawVoucher = await prisma.voucher.findFirst({
      where: whereClause,
      include: voucherInclude,
    })

    if (!rawVoucher) {
      return null
    }

    return new Voucher(rawVoucher)
  }

  async findAll(companyId: string, filters: VoucherFilterParams = {}): Promise<Voucher[]> {
    const rawVouchers = await prisma.voucher.findMany({
      where: buildVoucherWhereClause(companyId, filters),
      include: voucherInclude,
      orderBy: resolveVoucherOrderBy(filters.sortBy, filters.sortOrder),
    })

    return rawVouchers.map((voucher) => new Voucher(voucher))
  }

  async findPage(
    companyId: string,
    page: number,
    pageSize: number,
    filters: VoucherFilterParams = {}
  ): Promise<VoucherListResponse> {
    const whereClause = buildVoucherWhereClause(companyId, filters)
    const total = await prisma.voucher.count({
      where: whereClause,
    })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const currentPage = Math.min(page, totalPages)
    const rawVouchers = await prisma.voucher.findMany({
      where: whereClause,
      include: voucherInclude,
      orderBy: resolveVoucherOrderBy(filters.sortBy, filters.sortOrder),
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })

    return {
      items: rawVouchers.map(mapVoucherListItem),
      page: currentPage,
      pageSize,
      total,
      totalPages,
    }
  }

  async summarize(companyId: string, filters: VoucherFilterParams = {}): Promise<VoucherSummaryResponse> {
    const rawVouchers = await prisma.voucher.findMany({
      where: buildVoucherWhereClause(companyId, filters),
      select: {
        totalAmount: true,
        client: {
          select: {
            name: true,
            cuit: true,
          },
        },
        supplier: {
          select: {
            name: true,
            cuit: true,
          },
        },
      },
    })
    const totalsByParty = new Map<string, number>()
    let totalAmount = 0

    for (const rawVoucher of rawVouchers as VoucherSummaryRawRecord[]) {
      totalAmount += Number(rawVoucher.totalAmount)
      const partyName = rawVoucher.client?.name || rawVoucher.supplier?.name

      if (!partyName) {
        continue
      }

      const currentValue = totalsByParty.get(partyName) || 0
      totalsByParty.set(partyName, currentValue + Number(rawVoucher.totalAmount))
    }

    let topPartyName: string | null = null
    let topPartyAmount = -1

    for (const [partyName, partyAmount] of totalsByParty.entries()) {
      if (partyAmount > topPartyAmount) {
        topPartyName = partyName
        topPartyAmount = partyAmount
      }
    }

    return {
      totalCount: rawVouchers.length,
      totalAmount,
      topPartyName,
    }
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
      include: voucherInclude,
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
      include: voucherInclude,
    })

    return new Voucher(updatedVoucher)
  }

  async delete(companyId: string, id: string): Promise<void> {
    await prisma.voucher.delete({
      where: { id, companyId },
    })
  }

  async findForAnalytics(companyId: string, startDate: Date): Promise<Voucher[]> {
    const rawVouchers = await prisma.voucher.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
        },
      },
      include: voucherInclude,
      orderBy: { date: 'desc' },
    })

    return rawVouchers.map((voucher) => new Voucher(voucher))
  }
}
