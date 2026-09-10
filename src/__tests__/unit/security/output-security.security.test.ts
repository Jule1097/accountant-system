import { NextRequest } from "next/server"
import { GET as exportVouchers } from "src/app/api/vouchers/export/route"
import { GET as getSourceFile } from "src/app/api/conciliations/items/[itemId]/source/route"
import { buildExcelWorkbook } from "src/lib/helpers/platform/excel-builder"
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response"
import { VoucherExportService } from "src/services/voucher/VoucherExport"
import { ConciliationsService } from "src/services/conciliation/Conciliations"
import { requireRequestContext } from "src/lib/helpers/auth/request-context"

jest.mock("src/services/voucher/VoucherExport")
jest.mock("src/services/conciliation/Conciliations")
jest.mock("src/lib/helpers/auth/request-context", () => ({ requireRequestContext: jest.fn() }))

const companyId = "11111111-1111-4111-8111-111111111111"
const itemId = "22222222-2222-4222-8222-222222222222"

function createExportRequest(): NextRequest {
  return new NextRequest("http://localhost/api/vouchers/export?mode=filters&type=sale", { headers: { "x-company-id": companyId } })
}

describe("output encoding and information disclosure security boundary", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(requireRequestContext).mockResolvedValue({ userId: "33333333-3333-4333-8333-333333333333", companyId })
  })

  it("neutralizes formula-like values in spreadsheet text cells", () => {
    const workbook = buildExcelWorkbook("Export", "Company", "30111111119", "Filter", [{ header: "Nombre", key: "name", isText: true }], [{ name: "=HYPERLINK(\"https://evil.example\")" }])

    expect(workbook.worksheets[0].getCell("A7").value).toBe("'=HYPERLINK(\"https://evil.example\")")
  })

  it("does not allow an export filename to create additional Content-Disposition directives", async () => {
    jest.mocked(VoucherExportService).prototype.exportVouchers = jest.fn().mockResolvedValue({ filename: "report.xlsx\"; filename=\"evil.xlsx", buffer: Buffer.from("xlsx") })

    const response = await exportVouchers(createExportRequest())
    const header = response.headers.get("Content-Disposition") || ""

    expect(header.match(/filename=/g)).toHaveLength(1)
    expect(header).not.toContain("evil.xlsx")
  })

  it("does not allow a source filename to inject response headers", async () => {
    jest.mocked(ConciliationsService).prototype.getSourceFile = jest.fn().mockResolvedValue({ buffer: Buffer.from("pdf"), mimeType: "application/pdf", fileName: "invoice.pdf\"; filename=\"evil.pdf" })

    const response = await getSourceFile(new NextRequest(`http://localhost/api/conciliations/items/${itemId}/source`, { headers: { "x-company-id": companyId } }), { params: Promise.resolve({ itemId }) })
    const header = response.headers.get("Content-Disposition") || ""

    expect(header.match(/filename=/g)).toHaveLength(1)
    expect(header).not.toContain("evil.pdf")
  })

  it("keeps secrets and personal data out of unexpected error responses and logs", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation()
    const secret = "database-password-token-email@example.com"
    const response = resolveApplicationErrorResponse(new Error(secret), { request: new Request("http://localhost/api/vouchers"), operation: "load voucher", entityId: "voucher-1" })

    await expect(response.json()).resolves.toEqual({ error: "Error interno del servidor" })
    expect(consoleError.mock.calls.flat()).not.toContain(secret)
    consoleError.mockRestore()
  })
})
