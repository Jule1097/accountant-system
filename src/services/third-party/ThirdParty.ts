import { ThirdParty } from "src/models/third-party/ThirdParty"
import { ClientSupplierFilterParams, ClientSupplierListResponse } from "src/types/third-party/third-party-resource"
import { ThirdPartyData } from "src/types/third-party/third-party"
import { ThirdPartyServiceContract, ThirdPartyServiceMessages, ThirdPartyServiceOptions } from "src/types/third-party/third-party-service"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { ApplicationError } from "src/lib/errors/application-error"
import { thirdPartyRoles } from "src/lib/constants/third-party"

export class ThirdPartyService<TRecord, TCreate, TUpdate> implements ThirdPartyServiceContract<TRecord> {
  private readonly repository: ThirdPartyServiceOptions<TRecord, TCreate, TUpdate>["repository"]
  private readonly createModel: (data: ThirdPartyData) => ThirdParty
  private readonly getRecordId: (record: TRecord) => string
  private readonly messages: ThirdPartyServiceMessages

  constructor({ repository, createModel, getRecordId, messages }: ThirdPartyServiceOptions<TRecord, TCreate, TUpdate>) {
    this.repository = repository
    this.createModel = createModel
    this.getRecordId = getRecordId
    this.messages = messages
  }

  getAll(companyId: string): Promise<TRecord[]> {
    return this.repository.findAll(companyId)
  }

  getPage(
    companyId: string,
    page: number,
    pageSize: number,
    filters: ClientSupplierFilterParams = {}
  ): Promise<ClientSupplierListResponse<TRecord>> {
    return this.repository.findPage(companyId, page, pageSize, filters)
  }

  getById(companyId: string, id: string): Promise<TRecord | null> {
    return this.repository.findById(companyId, id)
  }

  hasVouchers(companyId: string, id: string): Promise<boolean> {
    return this.repository.hasVouchers(companyId, id)
  }

  async create(companyId: string, name: string, cuit: string | null, taxIdentificationMode?: ThirdPartyData["taxIdentificationMode"]): Promise<TRecord> {
    const model = this.createModel({ companyId, name, cuit, taxIdentificationMode })
    await this.ensureUnique(model, companyId)

    return this.repository.create({
      companyId,
      name: model.name,
      cuit: model.cuit,
      ...(model.role === thirdPartyRoles.supplier ? { taxIdentificationMode: model.taxIdentificationMode } : {}),
    } as TCreate)
  }

  async update(companyId: string, id: string, name: string, cuit: string | null, taxIdentificationMode?: ThirdPartyData["taxIdentificationMode"]): Promise<TRecord> {
    const existing = await this.repository.findById(companyId, id)

    if (!existing) {
      throw new ApplicationError(applicationErrorCodes.notFound, this.messages.notFound, "Third-party record not found")
    }

    const model = this.createModel({ id, companyId, name, cuit, taxIdentificationMode })
    await this.ensureUnique(model, companyId, id)

    return this.repository.update(companyId, id, { name: model.name, cuit: model.cuit, ...(model.role === thirdPartyRoles.supplier ? { taxIdentificationMode: model.taxIdentificationMode } : {}) } as TUpdate)
  }

  async delete(companyId: string, id: string): Promise<TRecord> {
    const existing = await this.repository.findById(companyId, id)

    if (!existing) {
      throw new ApplicationError(applicationErrorCodes.notFound, this.messages.notFound, "Third-party record not found")
    }

    if (await this.repository.hasVouchers(companyId, id)) {
      throw new ApplicationError(applicationErrorCodes.conflict, this.messages.deleteBlocked, "Third-party deletion is blocked")
    }

    return this.repository.delete(companyId, id)
  }

  private async ensureUnique(model: ThirdParty, companyId: string, excludedId?: string): Promise<void> {
    const existingByName = excludedId
      ? await this.repository.findByNormalizedName(companyId, model.normalizedName, excludedId)
      : await this.repository.findByNormalizedName(companyId, model.normalizedName)

    if (existingByName) {
      throw new ApplicationError(applicationErrorCodes.duplicate, this.messages.duplicateName, "Duplicate third-party name")
    }

    const existingByCuit = model.cuit ? await this.repository.findByCuitAndCompany(companyId, model.cuit) : null
    if (existingByCuit && this.getRecordId(existingByCuit) !== excludedId) {
      throw new ApplicationError(applicationErrorCodes.duplicate, this.messages.duplicateCuit, "Duplicate third-party tax identifier")
    }
  }
}
