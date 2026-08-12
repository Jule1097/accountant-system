import prisma from 'src/lib/prisma'
import { Prisma } from 'src/generated/prisma/client'

export class ClientRepository {
    async findById(companyId: string, id: string) {
        return prisma.client.findUnique({
            where: { id, companyId },
        })
    }
    async findByCuit(cuit: string) {
        return prisma.client.findFirst({
            where: { cuit },
        })
    }
    async findByCuitAndCompany(companyId: string, cuit: string) {
        return prisma.client.findFirst({
            where: { cuit, companyId },
        })
    }
    async findAll(companyId: string) {
        return prisma.client.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        })
    }
    async create(data: Prisma.ClientUncheckedCreateInput) {
        return prisma.client.create({ data })
    }
    async update(companyId: string, id: string, data: Prisma.ClientUncheckedUpdateInput) {
        return prisma.client.update({
            where: { id, companyId },
            data,
        })
    }
    async delete(companyId: string, id: string) {
        return prisma.client.delete({
            where: { id, companyId },
        })
    }
}