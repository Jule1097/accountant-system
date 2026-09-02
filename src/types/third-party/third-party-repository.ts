import { ClientSupplierFilterParams, ClientSupplierListResponse } from "src/types/third-party/third-party-resource"

export interface ThirdPartyRepository<TRecord, TCreate, TUpdate> {
  findById: (companyId: string, id: string) => Promise<TRecord | null>
  findByCuitAndCompany: (companyId: string, cuit: string) => Promise<TRecord | null>
  findByNormalizedName: (companyId: string, normalizedName: string, excludedId?: string) => Promise<TRecord | null>
  findAll: (companyId: string) => Promise<TRecord[]>
  findPage: (
    companyId: string,
    page: number,
    pageSize: number,
    filters?: ClientSupplierFilterParams
  ) => Promise<ClientSupplierListResponse<TRecord>>
  hasVouchers: (companyId: string, id: string) => Promise<boolean>
  create: (data: TCreate) => Promise<TRecord>
  update: (companyId: string, id: string, data: TUpdate) => Promise<TRecord>
  delete: (companyId: string, id: string) => Promise<TRecord>
}
