import { SupplierRepository } from 'src/repositories/supplier.repository'
import { normalizeCuit } from 'src/lib/cuit'
import { Supplier } from 'src/generated/prisma/client'
import { normalizeClientSupplierName } from 'src/lib/helpers/client-supplier'
import { ClientSupplierFilterParams, SupplierListResponse } from 'src/types/client-supplier'
import { supplierDuplicateCuitError, supplierDuplicateNameError, supplierDeleteBlockedError, supplierNotFoundError } from 'src/lib/constants/messages'

export class SupplierService {

    private repository: SupplierRepository

    constructor() {
        this.repository = new SupplierRepository()
    }

    async getAllSuppliers(companyId: string): Promise<Supplier[]> {
        return this.repository.findAll(companyId)
    }

    async getSupplierPage(
        companyId: string,
        page: number,
        pageSize: number,
        filters: ClientSupplierFilterParams = {}
    ): Promise<SupplierListResponse> {
        return this.repository.findPage(companyId, page, pageSize, filters)
    }

    async getSupplierById(companyId: string, id: string): Promise<Supplier | null> {
        return this.repository.findById(companyId, id)
    }

    async createSupplier(companyId: string, name: string, cuit: string): Promise<Supplier> {
        const normalizedName = normalizeClientSupplierName(name)
        const normalizedCuit = normalizeCuit(cuit)
        const existingByName = await this.repository.findByNormalizedName(companyId, normalizedName)

        if (existingByName) {
            throw new Error(supplierDuplicateNameError)
        }

        const existingByCuit = await this.repository.findByCuitAndCompany(companyId, normalizedCuit)
        if (existingByCuit) {
            throw new Error(supplierDuplicateCuitError)
        }

        return this.repository.create({
            companyId,
            name: name.trim(),
            cuit: normalizedCuit,
        })
    }

    async updateSupplier(companyId: string, id: string, name: string, cuit: string): Promise<Supplier> {
        const existing = await this.repository.findById(companyId, id)

        if (!existing) {
            throw new Error(supplierNotFoundError)
        }

        const normalizedName = normalizeClientSupplierName(name)
        const normalizedCuit = normalizeCuit(cuit)
        const existingByName = await this.repository.findByNormalizedName(companyId, normalizedName, id)

        if (existingByName) {
            throw new Error(supplierDuplicateNameError)
        }

        const existingByCuit = await this.repository.findByCuitAndCompany(companyId, normalizedCuit)
        if (existingByCuit && existingByCuit.id !== id) {
            throw new Error(supplierDuplicateCuitError)
        }

        return this.repository.update(companyId, id, { name: name.trim(), cuit: normalizedCuit })
    }

    async deleteSupplier(companyId: string, id: string): Promise<Supplier> {
        const existing = await this.repository.findById(companyId, id)

        if (!existing) {
            throw new Error(supplierNotFoundError)
        }

        const hasVouchers = await this.repository.hasVouchers(companyId, id)
        if (hasVouchers) {
            throw new Error(supplierDeleteBlockedError)
        }

        return this.repository.delete(companyId, id)
    }
}
