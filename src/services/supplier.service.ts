import { SupplierRepository } from 'src/repositories/supplier.repository'
import { normalizeCuit } from 'src/lib/cuit'

export class SupplierService {

    private repository: SupplierRepository

    constructor() {
        this.repository = new SupplierRepository()
    }

    async getAllSuppliers(companyId: string) {
        return this.repository.findAll(companyId)
    }

    async getSupplierById(companyId: string, id: string) {
        return this.repository.findById(companyId, id)
    }

    async createSupplier(companyId: string, name: string, cuit: string) {
        const normalizedCuit = normalizeCuit(cuit)
        const existing = await this.repository.findByCuit(normalizedCuit)
        if (existing) {
            throw new Error('El CUIT del proveedor ya se encuentra registrado en el sistema.')
        }
        return this.repository.create({
            companyId,
            name,
            cuit: normalizedCuit,
        })
    }

    async updateSupplier(companyId: string, id: string, name?: string, cuit?: string) {
        if (cuit) {
            const normalizedCuit = normalizeCuit(cuit)
            const existing = await this.repository.findByCuit(normalizedCuit)
            if (existing && existing.id !== id) {
                throw new Error('El CUIT del proveedor ya se encuentra registrado en el sistema.')
            }
            return this.repository.update(companyId, id, { name, cuit: normalizedCuit })
        }
        return this.repository.update(companyId, id, { name, cuit })
    }

    async deleteSupplier(companyId: string, id: string) {
        return this.repository.delete(companyId, id)
    }
}
