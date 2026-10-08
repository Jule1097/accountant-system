import { NextRequest } from "next/server"
import { POST as initializeUpload } from "src/app/api/vouchers/parse/uploads/route"
import { POST as confirmUpload } from "src/app/api/vouchers/parse/route"
import { requireRequestContext } from "src/lib/helpers/auth/request-context"
import { VoucherParserService } from "src/services/parser/VoucherParser"
import { ApplicationError } from "src/lib/errors/application-error"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { ParsedVoucherData } from "src/types/parser/gemini-parser"

jest.mock("src/lib/helpers/auth/request-context", () => ({ requireRequestContext: jest.fn() }))

function createJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/vouchers/parse", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-company-id": "company-1" } })
}

function createParsedVoucherData(): ParsedVoucherData {
  return { posNumber: null, number: null, date: null, currency: null, exchangeRate: null, subtotal: null, vatAmount: null, nonTaxableAmount: null, exemptAmount: null, otherTaxesAmount: null, totalAmount: null, concept: null, paymentMethod: null, status: null, paymentDate: null, paidAmount: null, comments: null, thirdPartyCuit: null, thirdPartyName: null, voucherType: "Factura", voucherLetter: "A", vatDetails: [], retentions: [], perceptions: [], thirdPartyId: null }
}

describe("parser direct upload routes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(requireRequestContext).mockResolvedValue({ userId: "user-1", companyId: "company-1" })
  })

  it("initializes a direct upload plan through the parser service", async () => {
    jest.spyOn(VoucherParserService.prototype, "createUploadPlan").mockResolvedValue({ planToken: "plan-token", expiresAt: "2026-10-08T12:15:00.000Z", bucket: "parser-temp", uploads: [] })

    const response = await initializeUpload(createJsonRequest({ voucherKind: "sale", files: [{ fileName: "invoice.pdf", mimeType: "application/pdf", fileSize: 1000 }] }))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual(expect.objectContaining({ planToken: "plan-token" }))
  })

  it("confirms a plan and preserves the existing single response contract", async () => {
    jest.spyOn(VoucherParserService.prototype, "confirmUpload").mockResolvedValue({ mode: "single", data: createParsedVoucherData() })

    const response = await confirmUpload(createJsonRequest({ planToken: "plan-token", itemIds: ["11111111-1111-4111-8111-111111111111"] }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(createParsedVoucherData())
  })

  it("returns malformed JSON as the established validation error", async () => {
    const request = new NextRequest("http://localhost/api/vouchers/parse", { method: "POST", headers: { "content-type": "application/json", "x-company-id": "company-1" } })
    jest.spyOn(request, "json").mockRejectedValue(new SyntaxError("invalid json"))

    const response = await confirmUpload(request)

    expect(response.status).toBe(400)
  })

  it("maps ownership errors without replacing the public message", async () => {
    jest.spyOn(VoucherParserService.prototype, "confirmUpload").mockRejectedValue(new ApplicationError(applicationErrorCodes.forbidden, "No tienes acceso a esta carga."))

    const response = await confirmUpload(createJsonRequest({ planToken: "plan-token", itemIds: ["11111111-1111-4111-8111-111111111111"] }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "No tienes acceso a esta carga." })
  })
})
