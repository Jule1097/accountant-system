import { createSupabaseAdminClient } from "src/lib/integrations/supabase-server"
import { ParserStorageService } from "src/services/parser/ParserStorage"

jest.mock("src/lib/integrations/supabase-server", () => ({
  createSupabaseAdminClient: jest.fn(),
}))

describe("ParserStorageService direct upload boundary", () => {
  const from = jest.fn()
  const storage = { from }

  beforeEach(() => {
    process.env.VOUCHER_PARSER_TEMP_BUCKET = "parser-temp"
    jest.clearAllMocks()
    jest.mocked(createSupabaseAdminClient).mockReturnValue({ storage } as never)
  })

  it("creates a non-upsert signed upload authorization", async () => {
    const createSignedUploadUrl = jest.fn().mockResolvedValue({ data: { path: "company/plan/item/invoice.pdf", token: "signed-token" }, error: null })
    from.mockReturnValue({ createSignedUploadUrl })

    const result = await new ParserStorageService().createSignedUploadUrl("company/plan/item/invoice.pdf")

    expect(createSignedUploadUrl).toHaveBeenCalledWith("company/plan/item/invoice.pdf", { upsert: false })
    expect(result).toEqual({ path: "company/plan/item/invoice.pdf", token: "signed-token" })
  })

  it("returns actual stored metadata from the private bucket", async () => {
    const info = jest.fn().mockResolvedValue({ data: { size: 1000, contentType: "application/pdf" }, error: null })
    from.mockReturnValue({ info })

    await expect(new ParserStorageService().getFileMetadata("company/plan/item/invoice.pdf")).resolves.toEqual({ fileSize: 1000, mimeType: "application/pdf" })
  })

  it("keeps download and deletion inside the configured bucket", async () => {
    const download = jest.fn().mockResolvedValue({ data: new Blob([Buffer.from("content")]), error: null })
    const remove = jest.fn().mockResolvedValue({ error: null })
    from.mockReturnValue({ download, remove })

    const service = new ParserStorageService()
    await service.downloadFile("company/plan/item/invoice.pdf")
    await service.deleteFile("company/plan/item/invoice.pdf")

    expect(from).toHaveBeenCalledWith("parser-temp")
    expect(download).toHaveBeenCalledWith("company/plan/item/invoice.pdf")
    expect(remove).toHaveBeenCalledWith(["company/plan/item/invoice.pdf"])
  })

  it("does not expose provider errors", async () => {
    const providerError = new Error("service role leaked")
    from.mockReturnValue({ createSignedUploadUrl: jest.fn().mockResolvedValue({ data: null, error: providerError }) })

    await expect(new ParserStorageService().createSignedUploadUrl("path")).rejects.toThrow("Parser storage operation failed")
  })
})
