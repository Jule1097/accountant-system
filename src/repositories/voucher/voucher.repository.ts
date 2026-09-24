import prisma from 'src/lib/database/prisma'
import { Prisma } from 'src/generated/prisma/client'
import { voucherMoneyErrorMessages, voucherZeroAmount } from 'src/lib/constants/voucher'
import { Voucher } from 'src/models/voucher/Voucher'
import { mapVoucherToPrismaData } from 'src/lib/helpers/voucher/voucher-persistence'
import { rehydrateVoucher, voucherInclude } from 'src/repositories/voucher/voucher-repository-shared'
import { ParsedVoucherData } from 'src/types/parser/gemini-parser'
import {
  VoucherFilterParams,
  VoucherListItem,
  VoucherListResponse,
  VoucherRecordType,
  VoucherSortOrder,
} from 'src/types/voucher/voucher'
import { voucherCurrencyCodes, voucherCurrencySymbols, voucherDocumentIdentificationModes, voucherNonFiscalDisplayValues, voucherTypeApplicabilityValues } from 'src/lib/constants/voucher'

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
    composedVoucherId: voucher.documentIdentificationMode === voucherDocumentIdentificationModes.nonFiscal ? voucherNonFiscalDisplayValues.number : `${voucher.voucherLetter || ''} ${voucher.posNumber}-${voucher.number}`.trim(),
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

  if (filters.currency) {
    whereClause.currency = filters.currency.toUpperCase() === voucherCurrencyCodes.ars ? { in: [voucherCurrencySymbols.ARS, voucherCurrencyCodes.ars] } : filters.currency.toUpperCase()
  }

  if (filters.search && filters.type) {
    whereClause.OR = resolveVoucherSearchWhere(filters.search, filters.type)
  }

  return whereClause
}

export class VoucherRepository {
  async isVoucherTypeApplicable(voucherTypeId: string, type: VoucherRecordType): Promise<boolean> {
    const voucherType = await prisma.voucherType.findUnique({ where: { id: voucherTypeId }, select: { applicability: true } })
    return !!voucherType && (voucherType.applicability === voucherTypeApplicabilityValues.both || voucherType.applicability === type)
  }

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
    const whereClause: Prisma.VoucherWhereInput = voucher.documentIdentificationMode === voucherDocumentIdentificationModes.nonFiscal
      ? {
        companyId: voucher.companyId,
        type: voucher.type,
        supplierId: duplicateCriteria.supplierId,
        date: new Date(voucher.date),
        totalAmount: voucher.totalAmount.toString(),
        documentIdentificationMode: voucherDocumentIdentificationModes.nonFiscal,
      }
      : {
      companyId: voucher.companyId,
      type: voucher.type,
      voucherTypeId: voucher.voucherTypeId,
      voucherLetterId: voucher.voucherLetterId,
      posNumber: voucher.posNumber,
      number: voucher.number,
      documentIdentificationMode: voucherDocumentIdentificationModes.fiscal,
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
      documentIdentificationMode: voucherDocumentIdentificationModes.fiscal,
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
      voucherLetter: voucher.voucherLetterId ? { connect: { id: voucher.voucherLetterId } } : { disconnect: true },
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

}
