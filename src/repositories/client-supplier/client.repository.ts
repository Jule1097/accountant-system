import prisma from 'src/lib/database/prisma'
import { Client, Prisma } from 'src/generated/prisma/client'
import { normalizeClientSupplierName, buildClientSupplierWhereClause, resolveClientSupplierOrderBy } from 'src/lib/helpers/client-supplier/client-supplier'
import { ClientListResponse, ClientSupplierFilterParams } from 'src/types/client-supplier/client-supplier'

export class ClientRepository {
    async findById(companyId: string, id: string): Promise<Client | null> {
        return prisma.client.findUnique({
            where: { id, companyId },
        })
    }
    async findByCuitAndCompany(companyId: string, cuit: string): Promise<Client | null> {
        return prisma.client.findFirst({
            where: { cuit, companyId },
        })
    }
    async findByNormalizedName(companyId: string, normalizedName: string, excludedId?: string): Promise<Client | null> {
        const records = await prisma.client.findMany({
            where: {
                companyId,
                id: excludedId ? { not: excludedId } : undefined,
            },
        })

        return records.find((record) => normalizeClientSupplierName(record.name) === normalizedName) || null
    }
    async findAll(companyId: string): Promise<Client[]> {
        return prisma.client.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        })
    }
    async findPage(companyId: string, page: number, pageSize: number, filters: ClientSupplierFilterParams = {}): Promise<ClientListResponse> {
        const whereClause = buildClientSupplierWhereClause(companyId, filters)
        const total = await prisma.client.count({
            where: whereClause,
        })
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const currentPage = Math.min(page, totalPages)
        const items = await prisma.client.findMany({
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
                clientId: id,
            },
        })

        return total > 0
    }
    async create(data: Prisma.ClientUncheckedCreateInput): Promise<Client> {
        return prisma.client.create({ data })
    }
    async update(companyId: string, id: string, data: Prisma.ClientUncheckedUpdateInput): Promise<Client> {
        return prisma.client.update({
            where: { id, companyId },
            data,
        })
    }
    async delete(companyId: string, id: string): Promise<Client> {
        return prisma.client.delete({
            where: { id, companyId },
        })
    }
}
