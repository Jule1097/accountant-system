import { ThirdParty } from "src/models/third-party/ThirdParty"
import { ClientSupplierFilterParams, ClientSupplierListResponse } from "src/types/third-party/third-party-resource"
import { ThirdPartyData } from "src/types/third-party/third-party"
import { ThirdPartyRepository } from "src/types/third-party/third-party-repository"

export interface ThirdPartyServiceMessages {
  duplicateName: string
  duplicateCuit: string
  notFound: string
  deleteBlocked: string
}

export interface ThirdPartyServiceOptions<TRecord, TCreate, TUpdate> {
  repository: ThirdPartyRepository<TRecord, TCreate, TUpdate>
  createModel: (data: ThirdPartyData) => ThirdParty
  getRecordId: (record: TRecord) => string
  messages: ThirdPartyServiceMessages
}

export interface ThirdPartyServiceContract<TRecord> {
  getAll: (companyId: string) => Promise<TRecord[]>
  getPage: (companyId: string, page: number, pageSize: number, filters?: ClientSupplierFilterParams) => Promise<ClientSupplierListResponse<TRecord>>
  getById: (companyId: string, id: string) => Promise<TRecord | null>
  create: (companyId: string, name: string, cuit: string) => Promise<TRecord>
  update: (companyId: string, id: string, name: string, cuit: string) => Promise<TRecord>
  delete: (companyId: string, id: string) => Promise<TRecord>
}
