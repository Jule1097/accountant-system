import { inputLimits } from "src/lib/constants/input-limits"
import { parserFileValidationMessages } from "src/lib/constants/parser"
import { parserUploadPlanSchema, parserUploadConfirmationSchema } from "src/lib/schemas/parser/parser-upload-schemas"
import { createParserUploadPlanToken, verifyParserUploadPlanToken } from "src/lib/helpers/parser/parser-upload-plan"
import { ParserUploadPlan } from "src/types/parser/parser-upload"

const plan: ParserUploadPlan = {
  planId: "11111111-1111-4111-8111-111111111111",
  batchId: "22222222-2222-4222-8222-222222222222",
  userId: "33333333-3333-4333-8333-333333333333",
  companyId: "44444444-4444-4444-8444-444444444444",
  voucherType: "sale",
  expiresAt: Date.now() + 900000,
  items: [{
    itemId: "55555555-5555-4555-8555-555555555555",
    fileName: "invoice.pdf",
    mimeType: "application/pdf",
    fileSize: 1000,
    storagePath: "44444444-4444-4444-8444-444444444444/22222222-2222-4222-8222-222222222222/55555555-5555-4555-8555-555555555555/invoice.pdf",
  }],
}

describe("parser upload contracts", () => {
  beforeEach(() => {
    process.env.PARSER_UPLOAD_PLAN_SECRET = "test-parser-upload-plan-secret"
  })

  it("accepts the approved initialization metadata contract", () => {
    const result = parserUploadPlanSchema.safeParse({
      voucherKind: "sale",
      files: [{ fileName: "invoice.pdf", mimeType: "application/pdf", fileSize: 1000 }],
    })

    expect(result.success).toBe(true)
  })

  it("rejects more files than the parser limit", () => {
    const result = parserUploadPlanSchema.safeParse({
      voucherKind: "sale",
      files: Array.from({ length: inputLimits.maxParserFiles + 1 }, (_, index) => ({ fileName: `invoice-${index}.pdf`, mimeType: "application/pdf", fileSize: 1000 })),
    })

    expect(result.success).toBe(false)
    if (result.success) throw new Error("Expected the parser upload plan schema to reject too many files")
    expect(result.error.issues[0].message).toBe(parserFileValidationMessages.maxFilesExceeded)
  })

  it("rejects malformed confirmation identity", () => {
    const result = parserUploadConfirmationSchema.safeParse({ planToken: "token", itemIds: [] })

    expect(result.success).toBe(false)
  })

  it("signs and verifies the plan without trusting client mutations", () => {
    const token = createParserUploadPlanToken(plan)
    const verifiedPlan = verifyParserUploadPlanToken(token)

    expect(verifiedPlan).toEqual(plan)
  })

  it("rejects an expired plan", () => {
    const token = createParserUploadPlanToken({ ...plan, expiresAt: Date.now() - 1 })

    expect(() => verifyParserUploadPlanToken(token)).toThrow("La carga de archivos expiró o no es válida.")
  })
})
