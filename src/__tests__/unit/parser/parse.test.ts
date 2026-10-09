import { NextRequest } from "next/server"
import { POST as initializeUpload } from "src/app/api/vouchers/parse/uploads/route"
import { POST as confirmUpload } from "src/app/api/vouchers/parse/route"
import { requireRequestContext } from "src/lib/helpers/auth/request-context"
import { parserFileValidationMessages } from "src/lib/constants/parser"
import { inputLimits } from "src/lib/constants/input-limits"
import { ApplicationError } from "src/lib/errors/application-error"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { VoucherParserService } from "src/services/parser/VoucherParser"
import { ParsedVoucherData } from "src/types/parser/gemini-parser"

jest.mock("src/lib/helpers/auth/request-context", () => ({ requireRequestContext: jest.fn() }))

const companyId = "11111111-1111-4111-8111-111111111111"
const userId = "22222222-2222-4222-8222-222222222222"
const itemId = "33333333-3333-4333-8333-333333333333"

function createJsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-company-id": companyId } })
}

function createParsedVoucherData(): ParsedVoucherData {
  return { posNumber: null, number: null, date: null, currency: null, exchangeRate: null, subtotal: null, vatAmount: null, nonTaxableAmount: null, exemptAmount: null, otherTaxesAmount: null, totalAmount: null, concept: null, paymentMethod: null, status: null, paymentDate: null, paidAmount: null, comments: null, thirdPartyCuit: null, thirdPartyName: null, voucherType: "Factura", voucherLetter: "A", vatDetails: [], retentions: [], perceptions: [], thirdPartyId: null }
}

describe("Parser direct upload route handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(requireRequestContext).mockResolvedValue({ userId, companyId })
  })

  it("returns a signed plan for valid metadata", async () => {
    jest.spyOn(VoucherParserService.prototype, "createUploadPlan").mockResolvedValue({ planToken: "plan-token", expiresAt: "2026-10-08T12:15:00.000Z", bucket: "parser-temp", uploads: [] })

    const response = await initializeUpload(createJsonRequest("/api/vouchers/parse/uploads", { voucherKind: "sale", files: [{ fileName: "invoice.pdf", mimeType: "application/pdf", fileSize: 1000 }] }))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual(expect.objectContaining({ planToken: "plan-token" }))
  })

  it("rejects the configured file-count limit before issuing authorizations", async () => {
    const files = Array.from({ length: inputLimits.maxParserFiles + 1 }, (_, index) => ({ fileName: `invoice-${index}.pdf`, mimeType: "application/pdf", fileSize: 1000 }))

    const response = await initializeUpload(createJsonRequest("/api/vouchers/parse/uploads", { voucherKind: "sale", files }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: parserFileValidationMessages.maxFilesExceeded })
    expect(VoucherParserService.prototype.createUploadPlan).not.toHaveBeenCalled()
  })

  it("preserves the existing single-file response after confirmation", async () => {
    jest.spyOn(VoucherParserService.prototype, "confirmUpload").mockResolvedValue({ mode: "single", data: createParsedVoucherData() })

    const response = await confirmUpload(createJsonRequest("/api/vouchers/parse", { planToken: "plan-token", itemIds: [itemId] }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(createParsedVoucherData())
  })

  it("preserves the accepted batch response after confirmation", async () => {
    jest.spyOn(VoucherParserService.prototype, "confirmUpload").mockResolvedValue({ mode: "batch", batch: { id: "44444444-4444-4444-8444-444444444444" } as never })

    const response = await confirmUpload(createJsonRequest("/api/vouchers/parse", { planToken: "plan-token", itemIds: [itemId] }))

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ mode: "batch", batch: { id: "44444444-4444-4444-8444-444444444444" } })
  })

  it("returns malformed JSON through the public validation contract", async () => {
    const request = new NextRequest("http://localhost/api/vouchers/parse", { method: "POST", headers: { "content-type": "application/json", "x-company-id": companyId } })
    jest.spyOn(request, "json").mockRejectedValue(new SyntaxError("invalid json"))

    const response = await confirmUpload(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "El cuerpo de la solicitud es inválido." })
  })

  it("maps expired plans and unexpected provider errors safely", async () => {
    jest.spyOn(VoucherParserService.prototype, "confirmUpload").mockRejectedValueOnce(new ApplicationError(applicationErrorCodes.validation, "La carga de archivos expiró o no es válida."))
    const expiredResponse = await confirmUpload(createJsonRequest("/api/vouchers/parse", { planToken: "plan-token", itemIds: [itemId] }))
    expect(expiredResponse.status).toBe(400)

    const consoleError = jest.spyOn(console, "error").mockImplementation()
    jest.spyOn(VoucherParserService.prototype, "confirmUpload").mockRejectedValueOnce(Object.assign(new Error("provider secret"), { code: "STORAGE_ERROR", status: 503 }))
    const providerResponse = await confirmUpload(createJsonRequest("/api/vouchers/parse", { planToken: "plan-token", itemIds: [itemId] }))
    expect(providerResponse.status).toBe(500)
    await expect(providerResponse.json()).resolves.toEqual({ error: "Error interno del servidor" })
    expect(consoleError).toHaveBeenCalledWith("Application request failed", expect.objectContaining({ operation: "confirm parser upload", providerErrorCode: "STORAGE_ERROR" }))
    consoleError.mockRestore()
  })
})
