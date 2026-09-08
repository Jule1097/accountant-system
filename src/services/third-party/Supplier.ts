import { SupplierRepository } from 'src/repositories/third-party/supplier.repository'
import { Supplier } from 'src/generated/prisma/client'
import { ClientSupplierFilterParams, SupplierListResponse } from 'src/types/third-party/third-party-resource'
import { supplierDuplicateCuitError, supplierDuplicateNameError, supplierDeleteBlockedError, supplierNotFoundError } from 'src/lib/constants/messages'
import { Supplier as SupplierModel } from 'src/models/third-party/Supplier'
import { SupplierRepositoryContract } from 'src/types/third-party/supplier-repository'
import { ThirdPartyService } from 'src/services/third-party/ThirdParty'

export class SupplierService {

    private readonly service: ThirdPartyService<Supplier, Parameters<SupplierRepositoryContract['create']>[0], Parameters<SupplierRepositoryContract['update']>[2]>

    constructor(repository: SupplierRepositoryContract = new SupplierRepository()) {
        this.service = new ThirdPartyService({
            repository,
            createModel: (data) => new SupplierModel(data),
            getRecordId: (record) => record.id,
            messages: {
                duplicateName: supplierDuplicateNameError,
                duplicateCuit: supplierDuplicateCuitError,
                notFound: supplierNotFoundError,
                deleteBlocked: supplierDeleteBlockedError,
            },
        })
    }

    async getAllSuppliers(companyId: string): Promise<Supplier[]> {
        return this.service.getAll(companyId)
    }

    async getSupplierPage(
        companyId: string,
        page: number,
        pageSize: number,
        filters: ClientSupplierFilterParams = {}
    ): Promise<SupplierListResponse> {
        return this.service.getPage(companyId, page, pageSize, filters)
    }

    async getSupplierById(companyId: string, id: string): Promise<Supplier | null> {
        return this.service.getById(companyId, id)
    }

    async createSupplier(companyId: string, name: string, cuit: string): Promise<Supplier> {
        return this.service.create(companyId, name, cuit)
    }

    async updateSupplier(companyId: string, id: string, name: string, cuit: string): Promise<Supplier> {
        return this.service.update(companyId, id, name, cuit)
    }

    async deleteSupplier(companyId: string, id: string): Promise<Supplier> {
        return this.service.delete(companyId, id)
    }
}
