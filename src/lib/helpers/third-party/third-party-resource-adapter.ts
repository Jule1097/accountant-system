import { buildClientSupplierCollectionPath, buildClientSupplierDetailPath } from "src/lib/helpers/third-party/third-party-management"
import { apiRequest } from "src/lib/api/api-client"
import { contentTypes, httpMethods } from "src/lib/constants/http"
import { companyPathFetcher } from "src/lib/helpers/platform/swr"
import { ClientSupplierEntityType, ClientSupplierFormValues, ClientSupplierListQueryState, ClientSupplierListResponse, ClientSupplierRecord } from "src/types/third-party/third-party-resource"
import { ResourceDetailAdapter, ResourceListAdapter, ResourceMutationAdapter } from "src/types/shared/resource"

export function createClientSupplierListAdapter(type: ClientSupplierEntityType): ResourceListAdapter<
  ClientSupplierListQueryState,
  ClientSupplierListResponse<ClientSupplierRecord>,
  ClientSupplierListResponse<ClientSupplierRecord>
> {
  return {
    buildPath: (query) => buildClientSupplierCollectionPath(type, query),
    fetch: (companyId, path) => companyPathFetcher<ClientSupplierListResponse<ClientSupplierRecord>>(companyId, path),
    mapResponse: (response) => response,
  }
}

export function createClientSupplierDetailAdapter(type: ClientSupplierEntityType): ResourceDetailAdapter<
  ClientSupplierRecord,
  ClientSupplierRecord
> {
  return {
    buildPath: (resourceId) => buildClientSupplierDetailPath(type, resourceId),
    fetch: (companyId, path) => companyPathFetcher<ClientSupplierRecord>(companyId, path),
    mapResponse: (response) => response,
  }
}

export function createClientSupplierMutationAdapter(
  type: ClientSupplierEntityType
): ResourceMutationAdapter<ClientSupplierFormValues, ClientSupplierFormValues, ClientSupplierRecord> {
  const parseResponse = async (response: Response): Promise<ClientSupplierRecord> => response.json() as Promise<ClientSupplierRecord>

  return {
    create: async (companyId, payload) => parseResponse(await apiRequest(`/api/${type}`, {
      method: httpMethods.post,
      headers: { "Content-Type": contentTypes.json, ...(companyId ? { "x-company-id": companyId } : {}) },
      body: JSON.stringify(payload),
    })),
    update: async (companyId, resourceId, payload) => parseResponse(await apiRequest(`/api/${type}/${resourceId}`, {
      method: httpMethods.put,
      headers: { "Content-Type": contentTypes.json, ...(companyId ? { "x-company-id": companyId } : {}) },
      body: JSON.stringify(payload),
    })),
    remove: async (companyId, resourceId) => parseResponse(await apiRequest(`/api/${type}/${resourceId}`, {
      method: httpMethods.delete,
      headers: companyId ? { "x-company-id": companyId } : {},
    })),
  }
}
