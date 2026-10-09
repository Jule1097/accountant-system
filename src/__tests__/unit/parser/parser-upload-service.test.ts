import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository"
import { ParserStorageService } from "src/services/parser/ParserStorage"
import { VoucherParserService } from "src/services/parser/VoucherParser"
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner"
import { applicationErrorCodes } from "src/lib/constants/application-error"

jest.mock("src/repositories/parser/parser-batch.repository")
jest.mock("src/services/parser/ParserStorage")
jest.mock("src/repositories/company/company.repository")
jest.mock("src/lib/integrations/gemini")

const companyId = "11111111-1111-4111-8111-111111111111"
const userId = "22222222-2222-4222-8222-222222222222"
const batchId = "33333333-3333-4333-8333-333333333333"
const itemIds = ["44444444-4444-4444-8444-444444444444", "55555555-5555-4555-8555-555555555555"]
const pdfBuffer = Buffer.from("%PDF-1.7 document")

describe("VoucherParserService direct upload workflow", () => {
  let service: VoucherParserService
  let repository: jest.Mocked<ParserBatchRepository>
  let storage: jest.Mocked<ParserStorageService>
  let runner: jest.Mocked<AsyncBatchRunner>

  beforeEach(() => {
    process.env.PARSER_UPLOAD_PLAN_SECRET = "test-parser-upload-plan-secret"
    process.env.VOUCHER_PARSER_TEMP_BUCKET = "parser-temp"
    jest.clearAllMocks()
    runner = { triggerParserBatch: jest.fn(), triggerPersistenceBatch: jest.fn() }
    service = new VoucherParserService(runner)
    repository = new ParserBatchRepository() as jest.Mocked<ParserBatchRepository>
    storage = new ParserStorageService() as jest.Mocked<ParserStorageService>
    storage.createSignedUploadUrl = jest.fn()
    storage.getFileMetadata = jest.fn()
    storage.downloadFile = jest.fn()
    storage.deleteFile = jest.fn()
    Object.defineProperty(service, "batchRepository", { value: repository, writable: true })
    Object.defineProperty(service, "storageService", { value: storage, writable: true })
  })

  it("does not authorize storage when initialization violates parser limits", async () => {
    const files = Array.from({ length: 21 }, (_, index) => ({ fileName: `invoice-${index}.pdf`, mimeType: "application/pdf", fileSize: 1000 }))

    await expect(service.createUploadPlan(companyId, userId, { voucherKind: "sale", files })).rejects.toMatchObject({ code: applicationErrorCodes.validation })
    expect(storage.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it.each([
    [[{ fileName: "large.pdf", mimeType: "application/pdf", fileSize: 2 * 1024 * 1024 + 1 }]],
    [[{ fileName: "invoice.txt", mimeType: "text/plain", fileSize: 1000 }]],
    [Array.from({ length: 7 }, (_, index) => ({ fileName: `invoice-${index}.png`, mimeType: "image/png", fileSize: 4 * 1024 * 1024 }))],
  ])("rejects invalid metadata before authorizing Storage", async (files) => {
    await expect(service.createUploadPlan(companyId, userId, { voucherKind: "sale", files })).rejects.toMatchObject({ code: applicationErrorCodes.validation })
    expect(storage.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it("creates a multi-file batch only after stored files pass metadata and content validation", async () => {
    storage.createSignedUploadUrl.mockResolvedValue({ path: "path", token: "token" })
    storage.getFileMetadata.mockResolvedValue({ fileSize: pdfBuffer.length, mimeType: "application/pdf" })
    storage.downloadFile.mockResolvedValueOnce(pdfBuffer).mockResolvedValueOnce(Buffer.from("%PDF-1.7 documeno"))
    repository.findBatchById.mockResolvedValue(null)
    repository.createBatchWithItems.mockResolvedValue({ id: batchId, companyId, createdByUserId: userId, voucherType: "sale", status: "queued", totalFiles: 2, expiresAt: "2026-10-08T00:00:00.000Z", createdAt: "2026-10-08T00:00:00.000Z", updatedAt: "2026-10-08T00:00:00.000Z", items: [] })
    const plan = await service.createUploadPlan(companyId, userId, { voucherKind: "sale", files: itemIds.map((itemId, index) => ({ fileName: `invoice-${index}.pdf`, mimeType: "application/pdf", fileSize: pdfBuffer.length })) })

    const response = await service.confirmUpload(companyId, userId, { planToken: plan.planToken, itemIds: plan.uploads.map((upload) => upload.itemId) })

    expect(response.mode).toBe("batch")
    expect(repository.createBatchWithItems).toHaveBeenCalledTimes(1)
    expect(runner.triggerParserBatch).toHaveBeenCalledWith(batchId)
  })

  it("cleans uploaded objects and creates no batch after a content validation failure", async () => {
    storage.createSignedUploadUrl.mockResolvedValue({ path: "path", token: "token" })
    storage.getFileMetadata.mockResolvedValue({ fileSize: pdfBuffer.length, mimeType: "application/pdf" })
    storage.downloadFile.mockResolvedValue(Buffer.from("not a pdf"))
    const plan = await service.createUploadPlan(companyId, userId, { voucherKind: "sale", files: [{ fileName: "invoice.pdf", mimeType: "application/pdf", fileSize: pdfBuffer.length }] })

    await expect(service.confirmUpload(companyId, userId, { planToken: plan.planToken, itemIds: [plan.uploads[0].itemId] })).rejects.toMatchObject({ code: applicationErrorCodes.validation })
    expect(repository.createBatchWithItems).not.toHaveBeenCalled()
    expect(storage.deleteFile).toHaveBeenCalled()
  })

  it("rejects duplicate stored content before creating a batch", async () => {
    storage.createSignedUploadUrl.mockResolvedValue({ path: "path", token: "token" })
    storage.getFileMetadata.mockResolvedValue({ fileSize: pdfBuffer.length, mimeType: "application/pdf" })
    storage.downloadFile.mockResolvedValue(pdfBuffer)
    const plan = await service.createUploadPlan(companyId, userId, { voucherKind: "sale", files: itemIds.map((_, index) => ({ fileName: `invoice-${index}.pdf`, mimeType: "application/pdf", fileSize: pdfBuffer.length })) })

    await expect(service.confirmUpload(companyId, userId, { planToken: plan.planToken, itemIds: plan.uploads.map((upload) => upload.itemId) })).rejects.toMatchObject({ code: applicationErrorCodes.validation })
    expect(repository.createBatchWithItems).not.toHaveBeenCalled()
  })

  it("rejects an incomplete confirmation without reading Storage", async () => {
    storage.createSignedUploadUrl.mockResolvedValue({ path: "path", token: "token" })
    const plan = await service.createUploadPlan(companyId, userId, { voucherKind: "sale", files: itemIds.map((_, index) => ({ fileName: `invoice-${index}.pdf`, mimeType: "application/pdf", fileSize: pdfBuffer.length })) })

    await expect(service.confirmUpload(companyId, userId, { planToken: plan.planToken, itemIds: [plan.uploads[0].itemId] })).rejects.toMatchObject({ code: applicationErrorCodes.validation })
    expect(storage.getFileMetadata).not.toHaveBeenCalled()
  })

  it("cleans stored objects when batch persistence fails", async () => {
    storage.createSignedUploadUrl.mockResolvedValue({ path: "path", token: "token" })
    storage.getFileMetadata.mockResolvedValue({ fileSize: pdfBuffer.length, mimeType: "application/pdf" })
    storage.downloadFile.mockResolvedValueOnce(pdfBuffer).mockResolvedValueOnce(Buffer.from("%PDF-1.7 documeno"))
    repository.findBatchById.mockResolvedValue(null)
    repository.createBatchWithItems.mockRejectedValue(new Error("database failure"))
    const plan = await service.createUploadPlan(companyId, userId, { voucherKind: "sale", files: itemIds.map((_, index) => ({ fileName: `invoice-${index}.pdf`, mimeType: "application/pdf", fileSize: pdfBuffer.length })) })

    await expect(service.confirmUpload(companyId, userId, { planToken: plan.planToken, itemIds: plan.uploads.map((upload) => upload.itemId) })).rejects.toThrow("database failure")
    expect(storage.deleteFile).toHaveBeenCalledTimes(plan.uploads.length)
  })

  it("logs cleanup failures without exposing provider details", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation()
    storage.createSignedUploadUrl.mockResolvedValue({ path: "path", token: "token" })
    storage.getFileMetadata.mockResolvedValue({ fileSize: pdfBuffer.length, mimeType: "application/pdf" })
    storage.downloadFile.mockResolvedValue(Buffer.from("not a pdf"))
    storage.deleteFile.mockRejectedValue(new Error("storage-token-private-path"))
    const plan = await service.createUploadPlan(companyId, userId, { voucherKind: "sale", files: [{ fileName: "invoice.pdf", mimeType: "application/pdf", fileSize: pdfBuffer.length }] })

    await expect(service.confirmUpload(companyId, userId, { planToken: plan.planToken, itemIds: [plan.uploads[0].itemId] })).rejects.toMatchObject({ code: applicationErrorCodes.validation })
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("storage-token-private-path")
    consoleError.mockRestore()
  })
})
