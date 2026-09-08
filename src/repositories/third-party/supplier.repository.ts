import prisma from 'src/lib/database/prisma'
import { Prisma, Supplier } from 'src/generated/prisma/client'
import { buildClientSupplierWhereClause, resolveClientSupplierOrderBy } from 'src/lib/helpers/third-party/third-party-persistence'
import { normalizeThirdPartyName } from 'src/lib/helpers/third-party/third-party'
import { ClientSupplierFilterParams, SupplierListResponse } from 'src/types/third-party/third-party-resource'
import { ThirdPartyRepository } from 'src/types/third-party/third-party-repository'

export class SupplierRepository implements ThirdPartyRepository<Supplier, Prisma.SupplierUncheckedCreateInput, Prisma.SupplierUncheckedUpdateInput> {

    async findById(companyId: string, id: string): Promise<Supplier | null> {
        return prisma.supplier.findUnique({
            where: { id, companyId },
        })
    }

    async findByCuitAndCompany(companyId: string, cuit: string): Promise<Supplier | null> {
        return prisma.supplier.findFirst({
            where: { cuit, companyId },
        })
    }

    async findByNormalizedName(companyId: string, normalizedName: string, excludedId?: string): Promise<Supplier | null> {
        const records = await prisma.supplier.findMany({
            where: {
                companyId,
                id: excludedId ? { not: excludedId } : undefined,
            },
        })

        return records.find((record) => normalizeThirdPartyName(record.name) === normalizedName) || null
    }

    async findAll(companyId: string): Promise<Supplier[]> {
        return prisma.supplier.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        })
    }

    async findPage(companyId: string, page: number, pageSize: number, filters: ClientSupplierFilterParams = {}): Promise<SupplierListResponse> {
        const whereClause = buildClientSupplierWhereClause(companyId, filters)
        const total = await prisma.supplier.count({
            where: whereClause,
        })
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const currentPage = Math.min(page, totalPages)
        const items = await prisma.supplier.findMany({
            where: whereClause,
            orderBy: resolveClientSupplierOrderBy(filters),
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        })

        return {
            items,
            page: currentPage,
            pageSize,
            total,
            totalPages,
        }
    }

    async hasVouchers(companyId: string, id: string): Promise<boolean> {
        const total = await prisma.voucher.count({
            where: {
                companyId,
                supplierId: id,
            },
        })

        return total > 0
    }

    async create(data: Prisma.SupplierUncheckedCreateInput): Promise<Supplier> {
        return prisma.supplier.create({ data })
    }

    async update(companyId: string, id: string, data: Prisma.SupplierUncheckedUpdateInput): Promise<Supplier> {
        return prisma.supplier.update({
            where: { id, companyId },
            data,
        })
    }

    async delete(companyId: string, id: string): Promise<Supplier> {
        return prisma.supplier.delete({
            where: { id, companyId },
        })
    }
}
