import { SupplierRepository } from 'src/repositories/third-party/supplier.repository'
import { Supplier } from 'src/generated/prisma/client'
import { ClientSupplierFilterParams, SupplierListResponse } from 'src/types/third-party/third-party-resource'
import { supplierDuplicateCuitError, supplierDuplicateNameError, supplierDeleteBlockedError, supplierNotFoundError } from 'src/lib/constants/messages'
import { Supplier as SupplierModel } from 'src/models/third-party/Supplier'
import { SupplierRepositoryContract } from 'src/types/third-party/supplier-repository'
import { ThirdPartyService } from 'src/services/third-party/ThirdParty'
import { SupplierTaxIdentificationMode } from 'src/types/third-party/third-party'
import { ApplicationError } from 'src/lib/errors/application-error'
import { applicationErrorCodes } from 'src/lib/constants/application-error'
import { supplierCuitRemovalBlockedError, supplierTaxIdentificationModes, supplierTaxIdentificationModeValues } from 'src/lib/constants/third-party'

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

    async createSupplier(companyId: string, name: string, modeOrCuit: SupplierTaxIdentificationMode | string | null, cuit?: string | null): Promise<Supplier> {
        const isMode = supplierTaxIdentificationModeValues.includes(modeOrCuit as SupplierTaxIdentificationMode)
        const taxIdentificationMode = isMode ? modeOrCuit as SupplierTaxIdentificationMode : modeOrCuit ? supplierTaxIdentificationModes.withCuit : supplierTaxIdentificationModes.withoutCuit
        const resolvedCuit = isMode ? cuit ?? null : modeOrCuit
        return this.service.create(companyId, name, resolvedCuit, taxIdentificationMode)
    }

    async updateSupplier(companyId: string, id: string, name: string, modeOrCuit: SupplierTaxIdentificationMode | string | null, cuit?: string | null): Promise<Supplier> {
        const isMode = supplierTaxIdentificationModeValues.includes(modeOrCuit as SupplierTaxIdentificationMode)
        const taxIdentificationMode = isMode ? modeOrCuit as SupplierTaxIdentificationMode : modeOrCuit ? supplierTaxIdentificationModes.withCuit : supplierTaxIdentificationModes.withoutCuit
        const resolvedCuit = isMode ? cuit ?? null : modeOrCuit
        const existing = await this.service.getById(companyId, id)
        if (existing && existing.cuit && taxIdentificationMode === supplierTaxIdentificationModes.withoutCuit && await this.service.hasVouchers(companyId, id)) {
            throw new ApplicationError(applicationErrorCodes.conflict, supplierCuitRemovalBlockedError, "Supplier CUIT removal is blocked after purchases exist")
        }

        return this.service.update(companyId, id, name, resolvedCuit, taxIdentificationMode)
    }

    async deleteSupplier(companyId: string, id: string): Promise<Supplier> {
        return this.service.delete(companyId, id)
    }
}
