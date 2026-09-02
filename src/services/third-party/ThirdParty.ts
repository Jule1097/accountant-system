import { ThirdParty } from "src/models/third-party/ThirdParty"
import { ClientSupplierFilterParams, ClientSupplierListResponse } from "src/types/third-party/third-party-resource"
import { ThirdPartyData } from "src/types/third-party/third-party"
import { ThirdPartyServiceContract, ThirdPartyServiceMessages, ThirdPartyServiceOptions } from "src/types/third-party/third-party-service"

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

  async create(companyId: string, name: string, cuit: string): Promise<TRecord> {
    const model = this.createModel({ companyId, name, cuit })
    await this.ensureUnique(model, companyId)

    return this.repository.create({
      companyId,
      name: model.name,
      cuit: model.cuit,
    } as TCreate)
  }

  async update(companyId: string, id: string, name: string, cuit: string): Promise<TRecord> {
    const existing = await this.repository.findById(companyId, id)

    if (!existing) {
      throw new Error(this.messages.notFound)
    }

    const model = this.createModel({ id, companyId, name, cuit })
    await this.ensureUnique(model, companyId, id)

    return this.repository.update(companyId, id, { name: model.name, cuit: model.cuit } as TUpdate)
  }

  async delete(companyId: string, id: string): Promise<TRecord> {
    const existing = await this.repository.findById(companyId, id)

    if (!existing) {
      throw new Error(this.messages.notFound)
    }

    if (await this.repository.hasVouchers(companyId, id)) {
      throw new Error(this.messages.deleteBlocked)
    }

    return this.repository.delete(companyId, id)
  }

  private async ensureUnique(model: ThirdParty, companyId: string, excludedId?: string): Promise<void> {
    const existingByName = excludedId
      ? await this.repository.findByNormalizedName(companyId, model.normalizedName, excludedId)
      : await this.repository.findByNormalizedName(companyId, model.normalizedName)

    if (existingByName) {
      throw new Error(this.messages.duplicateName)
    }

    const existingByCuit = await this.repository.findByCuitAndCompany(companyId, model.cuit)
    if (existingByCuit && this.getRecordId(existingByCuit) !== excludedId) {
      throw new Error(this.messages.duplicateCuit)
    }
  }
}
