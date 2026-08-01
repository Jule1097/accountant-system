import prisma from 'src/lib/prisma'
import { Prisma } from 'src/generated/prisma/client'

export class SupplierRepository {

    async findById(companyId: string, id: string) {
        return prisma.supplier.findUnique({
            where: { id, companyId },
        })
    }

    async findByCuit(cuit: string) {
        return prisma.supplier.findFirst({
            where: { cuit },
        })
    }

    async findAll(companyId: string) {
        return prisma.supplier.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        })
    }

    async create(data: Prisma.SupplierUncheckedCreateInput) {
        return prisma.supplier.create({ data })
    }

    async update(companyId: string, id: string, data: Prisma.SupplierUncheckedUpdateInput) {
        return prisma.supplier.update({
            where: { id, companyId },
            data,
        })
    }

    async delete(companyId: string, id: string) {
        return prisma.supplier.delete({
            where: { id, companyId },
        })
    }
}