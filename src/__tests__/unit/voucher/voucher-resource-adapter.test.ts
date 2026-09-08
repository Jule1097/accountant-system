import { createVoucherDetailAdapter, createVoucherListAdapter, createVoucherMutationAdapter, createVoucherSummaryAdapter } from "src/lib/helpers/voucher/voucher-resource-adapter"
import type { VoucherFormPayload } from "src/types/voucher/voucher-form"

const apiRequestMock = jest.fn()
const parseJsonResponseMock = jest.fn()

jest.mock("src/lib/api/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  parseJsonResponse: (...args: unknown[]) => parseJsonResponseMock(...args),
}))

describe("voucher resource adapters", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("builds collection, summary, and detail paths through existing voucher helpers", () => {
    const query = { page: 2, pageSize: 20, sortBy: "date" as const, sortOrder: "desc" as const, voucherId: null }

    expect(createVoucherListAdapter("sale").buildPath(query)).toBe("/api/vouchers?page=2&pageSize=20&type=sale")
    expect(createVoucherSummaryAdapter("purchase").buildPath(query)).toBe("/api/vouchers/summary?type=purchase")
    expect(createVoucherDetailAdapter().buildPath("voucher-1")).toBe("/api/vouchers/voucher-1")
  })

  it("uses the shared API boundary for voucher mutations", async () => {
    const response = { json: jest.fn() }
    const adapter = createVoucherMutationAdapter()
    const payload: VoucherFormPayload = {
      type: "sale",
      voucherTypeId: "voucher-type-1",
      voucherLetterId: "voucher-letter-1",
      posNumber: "00001",
      number: "00000001",
      clientId: "client-1",
      supplierId: null,
      date: "2026-01-01",
      currency: "$",
      exchangeRate: 1,
      subtotal: 100,
      vatAmount: 21,
      nonTaxableAmount: 0,
      exemptAmount: 0,
      otherTaxesAmount: 0,
      totalAmount: 121,
      paymentMethod: "Transferencia",
      status: "pending",
      paymentDate: null,
      paidAmount: 0,
      createdByUserId: "user-1",
      retentions: [],
      perceptions: [],
      vatDetails: [],
    }
    parseJsonResponseMock.mockResolvedValue({ id: "voucher-1" })
    apiRequestMock.mockResolvedValue(response)

    await adapter.create?.("company-1", payload)
    await adapter.update?.("company-1", "voucher-1", payload)
    await adapter.remove?.("company-1", "voucher-1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/vouchers", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "x-company-id": "company-1" }) }))
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/vouchers/voucher-1", expect.objectContaining({ method: "PUT", headers: expect.objectContaining({ "x-company-id": "company-1" }) }))
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/vouchers/voucher-1", { method: "DELETE", headers: { "x-company-id": "company-1" } })
    expect(parseJsonResponseMock).toHaveBeenCalledTimes(2)
  })
})
