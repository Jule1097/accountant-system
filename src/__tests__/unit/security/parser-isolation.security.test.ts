import { ApplicationError } from "src/lib/errors/application-error"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository"
import { ParserStorageService } from "src/services/parser/ParserStorage"
import { VoucherParserService } from "src/services/parser/VoucherParser"
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner"
import { ParserBatchItemContextRecord } from "src/types/parser/parser-batch"
import { ParserAcceptedFile } from "src/lib/helpers/parser/parser-file"

jest.mock("src/repositories/parser/parser-batch.repository")
jest.mock("src/services/parser/ParserStorage")

const companyId = "11111111-1111-4111-8111-111111111111"
const foreignCompanyId = "22222222-2222-4222-8222-222222222222"
const batchId = "33333333-3333-4333-8333-333333333333"
const itemId = "44444444-4444-4444-8444-444444444444"

function createItem(itemCompanyId: string): ParserBatchItemContextRecord {
  return {
    id: itemId,
    batchId,
    fileName: "invoice.pdf",
    mimeType: "application/pdf",
    fileSize: 100,
    fileHash: "hash",
    storagePath: "path",
    inputStrategy: "pdf-text",
    status: "failed",
    parsedPayload: null,
    validatedPayload: null,
    currentError: "failed",
    currentAttempt: 1,
    queuedAt: null,
    processedAt: null,
    expiresAt: "2026-09-10T00:00:00.000Z",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
    batch: {
      id: batchId,
      companyId: itemCompanyId,
      createdByUserId: "55555555-5555-4555-8555-555555555555",
      voucherType: "sale",
      status: "partial",
      expiresAt: "2026-09-10T00:00:00.000Z",
    },
  }
}

function createService(): { service: VoucherParserService; repository: jest.Mocked<ParserBatchRepository>; runner: jest.Mocked<AsyncBatchRunner> } {
  const runner = { triggerParserBatch: jest.fn(), triggerPersistenceBatch: jest.fn() }
  const service = new VoucherParserService(runner)
  const repository = new ParserBatchRepository() as jest.Mocked<ParserBatchRepository>
  Object.defineProperty(service, "batchRepository", { value: repository, writable: true })
  Object.defineProperty(service, "storageService", { value: new ParserStorageService(), writable: true })
  return { service, repository, runner }
}

function createAcceptedFile(index: number): ParserAcceptedFile {
  return {
    fileName: `invoice-${index}.pdf`,
    mimeType: "application/pdf",
    fileSize: 100,
    buffer: Buffer.from(`file-${index}`),
    fileHash: `hash-${index}`,
  }
}

describe("parser item ownership security boundary", () => {
  beforeEach(() => jest.clearAllMocks())

  it("rejects retry of an item owned by another company", async () => {
    const { service, repository, runner } = createService()
    repository.findItemById.mockResolvedValue(createItem(foreignCompanyId))

    await expect(service.retryItem(companyId, itemId)).rejects.toMatchObject({ code: applicationErrorCodes.notFound })
    expect(repository.requeueItem).not.toHaveBeenCalled()
    expect(runner.triggerParserBatch).not.toHaveBeenCalled()
  })

  it("rejects retry of a missing item without mutating parser state", async () => {
    const { service, repository, runner } = createService()
    repository.findItemById.mockResolvedValue(null)

    await expect(service.retryItem(companyId, itemId)).rejects.toMatchObject({ code: applicationErrorCodes.notFound })
    expect(repository.requeueItem).not.toHaveBeenCalled()
    expect(runner.triggerParserBatch).not.toHaveBeenCalled()
  })

  it("keeps not-found errors generic for parser resources", async () => {
    const error = new ApplicationError(applicationErrorCodes.notFound, "No se encontrÃ³ el Ã­tem solicitado", "Parser item not found")

    expect(error.publicMessage).not.toMatch(/password|token|secret|sql/i)
  })

  it("rejects a parser request with more than the supported file count", async () => {
    const { service } = createService()
    const files = Array.from({ length: 21 }, (_, index) => createAcceptedFile(index))

    await expect(service.createBatch(companyId, "55555555-5555-4555-8555-555555555555", "sale", files)).rejects.toMatchObject({ code: applicationErrorCodes.validation })
  })
})
