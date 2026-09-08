import { apiRequest, parseJsonResponse } from "src/lib/api/api-client"
import { contentTypes, httpMethods } from "src/lib/constants/http"
import { companyPathFetcher } from "src/lib/helpers/platform/swr"
import { buildVoucherCollectionPath, buildVoucherDetailPath, buildVoucherSummaryPath } from "src/lib/helpers/voucher/voucher-management"
import type { ResourceDetailAdapter, ResourceListAdapter, ResourceMutationAdapter } from "src/types/shared/resource"
import type { VoucherApiResponse } from "src/types/voucher/voucher-api"
import type { VoucherFormPayload } from "src/types/voucher/voucher-form"
import type { VoucherListQueryState, VoucherListResponse, VoucherRecordType, VoucherSummaryResponse } from "src/types/voucher/voucher"

export function createVoucherListAdapter(type: VoucherRecordType): ResourceListAdapter<VoucherListQueryState, VoucherListResponse, VoucherListResponse> {
  return {
    buildPath: (query) => buildVoucherCollectionPath(type, query),
    fetch: (companyId, path) => companyPathFetcher<VoucherListResponse>(companyId, path),
    mapResponse: (response) => response,
  }
}

export function createVoucherSummaryAdapter(type: VoucherRecordType): ResourceListAdapter<VoucherListQueryState, VoucherSummaryResponse, VoucherSummaryResponse> {
  return {
    buildPath: (query) => buildVoucherSummaryPath(type, query),
    fetch: (companyId, path) => companyPathFetcher<VoucherSummaryResponse>(companyId, path),
    mapResponse: (response) => response,
  }
}

export function createVoucherDetailAdapter(): ResourceDetailAdapter<VoucherApiResponse, VoucherApiResponse> {
  return {
    buildPath: (resourceId) => buildVoucherDetailPath(resourceId),
    fetch: (companyId, path) => companyPathFetcher<VoucherApiResponse>(companyId, path),
    mapResponse: (response) => response,
  }
}

export function createVoucherMutationAdapter(): ResourceMutationAdapter<VoucherFormPayload, VoucherFormPayload, VoucherApiResponse | void> {
  return {
    create: async (companyId, payload) => parseJsonResponse<VoucherApiResponse>(await apiRequest("/api/vouchers", {
      method: httpMethods.post,
      headers: { "Content-Type": contentTypes.json, ...(companyId ? { "x-company-id": companyId } : {}) },
      body: JSON.stringify(payload),
    })),
    update: async (companyId, resourceId, payload) => parseJsonResponse<VoucherApiResponse>(await apiRequest(`/api/vouchers/${resourceId}`, {
      method: httpMethods.put,
      headers: { "Content-Type": contentTypes.json, ...(companyId ? { "x-company-id": companyId } : {}) },
      body: JSON.stringify(payload),
    })),
    remove: async (companyId, resourceId) => {
      await apiRequest(`/api/vouchers/${resourceId}`, {
        method: httpMethods.delete,
        headers: companyId ? { "x-company-id": companyId } : {},
      })
    },
  }
}
