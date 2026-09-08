import prisma from 'src/lib/database/prisma'
import { Prisma } from 'src/generated/prisma/client'
import { voucherMoneyErrorMessages, voucherZeroAmount } from 'src/lib/constants/voucher'
import { Voucher } from 'src/models/voucher/Voucher'
import { VoucherFactory } from 'src/models/voucher/VoucherFactory'
import { mapPrismaVoucherToDomainInput, mapVoucherToPrismaData } from 'src/lib/helpers/voucher/voucher-persistence'
import { ParsedVoucherData } from 'src/types/parser/gemini-parser'
import {
  DashboardRecentActivityData,
  DashboardRecentPurchaseEntry,
  DashboardWeeklySalesEntry,
} from "src/types/dashboard/dashboard"
import {
  VoucherFilterParams,
  VoucherListItem,
  VoucherListResponse,
  VoucherRecordType,
  VoucherSortOrder,
  VoucherSummaryResponse,
} from 'src/types/voucher/voucher'

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

interface DashboardRecentSaleRawRecord {
  date: Date
  totalAmount: Prisma.Decimal
}

interface DashboardRecentPurchaseRawRecord {
  id: string
  date: Date
  totalAmount: Prisma.Decimal
  supplier: {
    name: string
  } | null
  voucherType: {
    name: string
  } | null
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
    return [{ status: direction }, { date: 'desc' }, { id: 'desc' }]
  }

  if (sortBy === 'voucher') {
    return [
      { voucherLetter: { letter: direction } },
      { posNumber: direction },
      { number: direction },
      { id: 'desc' },
    ]
  }

  return [{ date: direction }, { id: 'desc' }]
}

function rehydrateVoucher(rawVoucher: Prisma.VoucherGetPayload<{ include: typeof voucherInclude }>): Voucher {
  return VoucherFactory.rehydrate(mapPrismaVoucherToDomainInput(rawVoucher))
}

function requireRelationId(value: string | undefined, message: string): string {
  if (!value) throw new Error(message)
  return value
}

function mapVoucherListItem(rawVoucher: Prisma.VoucherGetPayload<{ include: typeof voucherInclude }>): VoucherListItem<Voucher> {
  const voucher = rehydrateVoucher(rawVoucher)
  const party = voucher.getParty()

  return {
    rowKey: rawVoucher.id,
    voucher,
    composedVoucherId: `${voucher.voucherLetter || ''} ${voucher.posNumber}-${voucher.number}`.trim(),
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

function buildDashboardWeeklySales(
  sales: DashboardRecentSaleRawRecord[],
  now: Date
): DashboardWeeklySalesEntry[] {
  const weeklySales = [
    { week: "Semana 1", amount: 0 },
    { week: "Semana 2", amount: 0 },
    { week: "Semana 3", amount: 0 },
    { week: "Semana 4", amount: 0 },
    { week: "Semana 5", amount: 0 },
  ]
  const days35Ago = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)

  sales
    .slice()
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .forEach((sale) => {
      if (sale.date < days35Ago) {
        return
      }

      const diffTime = now.getTime() - sale.date.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const weekIndex = 4 - Math.floor(diffDays / 7)

      if (weekIndex < 0 || weekIndex >= weeklySales.length) {
        return
      }

      weeklySales[weekIndex].amount += Number(sale.totalAmount)
    })

  return weeklySales
}

function mapDashboardRecentPurchases(
  purchases: DashboardRecentPurchaseRawRecord[]
): DashboardRecentPurchaseEntry[] {
  return purchases.map((purchase) => ({
    id: purchase.id,
    supplierName: purchase.supplier?.name || null,
    date: purchase.date.toISOString(),
    voucherTypeName: purchase.voucherType?.name || null,
    totalAmount: Number(purchase.totalAmount),
  }))
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

    return rehydrateVoucher(rawVoucher)
  }

  async findDuplicate(voucher: Voucher): Promise<Voucher | null> {
    const { duplicateCriteria } = voucher.getPersistenceData()
    const whereClause: Prisma.VoucherWhereInput = {
      companyId: voucher.companyId,
      type: voucher.type,
      voucherTypeId: voucher.voucherTypeId,
      voucherLetterId: voucher.voucherLetterId,
      posNumber: voucher.posNumber,
      number: voucher.number,
      ...duplicateCriteria,
    }

    const rawVoucher = await prisma.voucher.findFirst({
      where: whereClause,
      include: voucherInclude,
    })

    if (!rawVoucher) {
      return null
    }

    return rehydrateVoucher(rawVoucher)
  }

  async findDuplicateByParsedPayload(
    companyId: string,
    type: VoucherRecordType,
    parsedPayload: ParsedVoucherData
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

    return rehydrateVoucher(rawVoucher)
  }

  async findAll(companyId: string, filters: VoucherFilterParams = {}): Promise<Voucher[]> {
    const rawVouchers = await prisma.voucher.findMany({
      where: buildVoucherWhereClause(companyId, filters),
      include: voucherInclude,
      orderBy: resolveVoucherOrderBy(filters.sortBy, filters.sortOrder),
    })

    return rawVouchers.map(rehydrateVoucher)
  }

  async findPage(
    companyId: string,
    page: number,
    pageSize: number,
    filters: VoucherFilterParams = {}
  ): Promise<VoucherListResponse<Voucher>> {
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
    const items = rawVouchers.map(mapVoucherListItem)

    return {
      items,
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
    const persistenceData = voucher.getPersistenceData()
    const data: Prisma.VoucherUncheckedCreateInput = {
      ...mapVoucherToPrismaData(voucher),
      retentions: {
        create: persistenceData.retentions.map((retention) => ({
          retentionConceptId: requireRelationId(retention.retentionConceptId, voucherMoneyErrorMessages.missingRetentionConcept),
          taxJurisdictionId: retention.taxJurisdictionId,
          amount: retention.amount.toString(),
        })),
      },
      perceptions: {
        create: persistenceData.perceptions.map((perception) => ({
          perceptionConceptId: requireRelationId(perception.perceptionConceptId, voucherMoneyErrorMessages.missingPerceptionConcept),
          taxJurisdictionId: perception.taxJurisdictionId,
          amount: perception.amount.toString(),
        })),
      },
      vatDetails: {
        create: voucher.vatDetails.map((detail) => ({
          vatRateId: requireRelationId(detail.vatRateId, voucherMoneyErrorMessages.missingVatRate),
          subtotal: detail.subtotal?.toString() || detail.amount?.toString() || voucherZeroAmount,
          vatAmount: detail.vatAmount?.toString() || voucherZeroAmount,
        })),
      },
    }

    const createdVoucher = await prisma.voucher.create({
      data,
      include: voucherInclude,
    })

    return rehydrateVoucher(createdVoucher)
  }

  async update(voucher: Voucher): Promise<Voucher> {
    if (!voucher.id) {
      throw new Error('Voucher ID is required for update')
    }

    const scalarData = mapVoucherToPrismaData(voucher)
    const persistenceData = voucher.getPersistenceData()
    Reflect.deleteProperty(scalarData, "id")
    Reflect.deleteProperty(scalarData, "companyId")
    Reflect.deleteProperty(scalarData, "voucherTypeId")
    Reflect.deleteProperty(scalarData, "voucherLetterId")
    Reflect.deleteProperty(scalarData, "clientId")
    Reflect.deleteProperty(scalarData, "supplierId")
    Reflect.deleteProperty(scalarData, "createdByUserId")
    const data: Prisma.VoucherUpdateInput = {
      ...scalarData,
      voucherType: { connect: { id: voucher.voucherTypeId } },
      voucherLetter: { connect: { id: voucher.voucherLetterId } },
      createdByUser: { connect: { id: voucher.createdByUserId } },
      client: persistenceData.clientId ? { connect: { id: persistenceData.clientId } } : { disconnect: true },
      supplier: persistenceData.supplierId ? { connect: { id: persistenceData.supplierId } } : { disconnect: true },
      retentions: {
        deleteMany: {},
        create: persistenceData.retentions.map((retention) => ({
          retentionConcept: { connect: { id: requireRelationId(retention.retentionConceptId, voucherMoneyErrorMessages.missingRetentionConcept) } },
          ...(retention.taxJurisdictionId ? { taxJurisdiction: { connect: { id: retention.taxJurisdictionId } } } : {}),
          amount: retention.amount.toString(),
        })),
      },
      perceptions: {
        deleteMany: {},
        create: persistenceData.perceptions.map((perception) => ({
          perceptionConcept: { connect: { id: requireRelationId(perception.perceptionConceptId, voucherMoneyErrorMessages.missingPerceptionConcept) } },
          ...(perception.taxJurisdictionId ? { taxJurisdiction: { connect: { id: perception.taxJurisdictionId } } } : {}),
          amount: perception.amount.toString(),
        })),
      },
      vatDetails: {
        deleteMany: {},
        create: voucher.vatDetails.map((detail) => ({
          vatRate: { connect: { id: requireRelationId(detail.vatRateId, voucherMoneyErrorMessages.missingVatRate) } },
          subtotal: detail.subtotal?.toString() || detail.amount?.toString() || voucherZeroAmount,
          vatAmount: detail.vatAmount?.toString() || voucherZeroAmount,
        })),
      },
    }

    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucher.id, companyId: voucher.companyId },
      data,
      include: voucherInclude,
    })

    return rehydrateVoucher(updatedVoucher)
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

    return rawVouchers.map(rehydrateVoucher)
  }

  async findDashboardRecentActivity(companyId: string): Promise<DashboardRecentActivityData> {
    const now = new Date()
    const salesCutoff = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
    const sales = await prisma.voucher.findMany({
      where: {
        companyId,
        type: "sale",
        date: {
          gte: salesCutoff,
        },
      },
      select: {
        date: true,
        totalAmount: true,
      },
      orderBy: {
        date: "desc",
      },
    })
    const purchases = await prisma.voucher.findMany({
      where: {
        companyId,
        type: "purchase",
      },
      select: {
        id: true,
        date: true,
        totalAmount: true,
        supplier: {
          select: {
            name: true,
          },
        },
        voucherType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 3,
    })

    return {
      weeklySales: buildDashboardWeeklySales(sales as DashboardRecentSaleRawRecord[], now),
      recentPurchases: mapDashboardRecentPurchases(purchases as DashboardRecentPurchaseRawRecord[]),
    }
  }
}
