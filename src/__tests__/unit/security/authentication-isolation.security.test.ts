import { NextRequest } from "next/server"
import { GET as getCatalogs } from "src/app/api/catalogs/route"
import { GET as getDashboardActivity } from "src/app/api/dashboard/recent-activity/route"
import { GET as getClient } from "src/app/api/clients/[id]/route"
import { GET as getSupplier } from "src/app/api/suppliers/[id]/route"
import { GET as getVoucher } from "src/app/api/vouchers/[id]/route"
import { DELETE as deleteNotification } from "src/app/api/notifications/[notificationId]/route"
import { POST as retryBatch } from "src/app/api/vouchers/parse/batches/[batchId]/retry/route"
import { POST as retryParserItem } from "src/app/api/vouchers/parse/items/[itemId]/retry/route"
import { POST as persistConciliationItem } from "src/app/api/conciliations/items/[itemId]/persist/route"
import { requestContextErrorCodes } from "src/lib/constants/auth"
import { RequestContextError } from "src/lib/errors/request-context"
import { requireRequestContext } from "src/lib/helpers/auth/request-context"
import { CatalogService } from "src/services/catalog/Catalog"
import { DashboardService } from "src/services/dashboard/Dashboard"
import { ClientService } from "src/services/third-party/Client"
import { SupplierService } from "src/services/third-party/Supplier"
import { VoucherService } from "src/services/voucher/Voucher"
import { CompanyNotificationService } from "src/services/company/CompanyNotification"
import { VoucherParserService } from "src/services/parser/VoucherParser"
import { VoucherPersistenceService } from "src/services/parser/VoucherPersistence"

jest.mock("src/lib/helpers/auth/request-context", () => ({ requireRequestContext: jest.fn() }))
jest.mock("src/services/catalog/Catalog")
jest.mock("src/services/dashboard/Dashboard")
jest.mock("src/services/third-party/Client")
jest.mock("src/services/third-party/Supplier")
jest.mock("src/services/voucher/Voucher")
jest.mock("src/services/company/CompanyNotification")
jest.mock("src/services/parser/VoucherParser")
jest.mock("src/services/parser/VoucherPersistence")

const activeCompanyId = "11111111-1111-4111-8111-111111111111"
const foreignCompanyId = "22222222-2222-4222-8222-222222222222"
const recordId = "33333333-3333-4333-8333-333333333333"

function createRequest(path: string, companyId = activeCompanyId): NextRequest {
  return new NextRequest(`http://localhost${path}`, { headers: { "x-company-id": companyId } })
}

function rejectContext(code: keyof typeof requestContextErrorCodes): void {
  jest.mocked(requireRequestContext).mockRejectedValue(new RequestContextError(requestContextErrorCodes[code]))
}

describe("authentication and company isolation security boundary", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(requireRequestContext).mockRejectedValue(new RequestContextError(requestContextErrorCodes.unauthenticated))
    jest.mocked(CatalogService).prototype.getFullCatalog = jest.fn().mockResolvedValue({})
    jest.mocked(DashboardService).prototype.getRecentActivity = jest.fn().mockResolvedValue({})
  })

  it("rejects anonymous catalog access", async () => {
    const response = await getCatalogs(createRequest("/api/catalogs"))

    expect(response.status).toBe(401)
    expect(CatalogService).not.toHaveBeenCalled()
  })

  it("rejects anonymous dashboard access even when a company header is supplied", async () => {
    const response = await getDashboardActivity(createRequest("/api/dashboard/recent-activity", foreignCompanyId))

    expect(response.status).toBe(401)
    expect(DashboardService).not.toHaveBeenCalled()
  })

  it("blocks an authenticated user from an unrelated client record", async () => {
    rejectContext("companyForbidden")

    const response = await getClient(createRequest(`/api/clients/${recordId}`, foreignCompanyId), { params: Promise.resolve({ id: recordId }) })

    expect(response.status).toBe(403)
    expect(ClientService).not.toHaveBeenCalled()
  })

  it("blocks an authenticated user from an unrelated supplier record", async () => {
    rejectContext("companyForbidden")

    const response = await getSupplier(createRequest(`/api/suppliers/${recordId}`, foreignCompanyId), { params: Promise.resolve({ id: recordId }) })

    expect(response.status).toBe(403)
    expect(SupplierService).not.toHaveBeenCalled()
  })

  it("blocks an authenticated user from an unrelated voucher record", async () => {
    rejectContext("companyForbidden")

    const response = await getVoucher(createRequest(`/api/vouchers/${recordId}`, foreignCompanyId), { params: Promise.resolve({ id: recordId }) })

    expect(response.status).toBe(403)
    expect(VoucherService).not.toHaveBeenCalled()
  })

  it("blocks deletion of an unrelated notification", async () => {
    rejectContext("companyForbidden")

    const response = await deleteNotification(createRequest(`/api/notifications/${recordId}`, foreignCompanyId), { params: Promise.resolve({ notificationId: recordId }) })

    expect(response.status).toBe(403)
    expect(CompanyNotificationService).not.toHaveBeenCalled()
  })

  it("blocks retrying an unrelated parser batch", async () => {
    rejectContext("companyForbidden")

    const response = await retryBatch(createRequest(`/api/vouchers/parse/batches/${recordId}/retry`, foreignCompanyId), { params: Promise.resolve({ batchId: recordId }) })

    expect(response.status).toBe(403)
    expect(VoucherParserService).not.toHaveBeenCalled()
  })

  it("blocks retrying an unrelated parser item", async () => {
    rejectContext("companyForbidden")

    const response = await retryParserItem(createRequest(`/api/vouchers/parse/items/${recordId}/retry`, foreignCompanyId), { params: Promise.resolve({ itemId: recordId }) })

    expect(response.status).toBe(403)
    expect(VoucherParserService).not.toHaveBeenCalled()
  })

  it("blocks persisting an unrelated conciliation item", async () => {
    rejectContext("companyForbidden")

    const response = await persistConciliationItem(createRequest(`/api/conciliations/items/${recordId}/persist`, foreignCompanyId), { params: Promise.resolve({ itemId: recordId }) })

    expect(response.status).toBe(403)
    expect(VoucherPersistenceService).not.toHaveBeenCalled()
  })
})
