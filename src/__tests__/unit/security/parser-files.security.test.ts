import { buildParserStoragePath, ensureParserFileSize, ensureParserTotalFileSize, toParserAcceptedFile } from "src/lib/helpers/parser/parser-file"
import { applicationErrorCodes } from "src/lib/constants/application-error"

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function createFile(overrides: Partial<File> = {}): File {
  return {
    name: "invoice.png",
    type: "image/png",
    size: pngSignature.length,
    arrayBuffer: async () => pngSignature.buffer.slice(pngSignature.byteOffset, pngSignature.byteOffset + pngSignature.byteLength),
    ...overrides,
  } as File
}

describe("uploaded document security boundary", () => {
  it("rejects content that does not match its declared image MIME type", async () => {
    const file = createFile({ arrayBuffer: async () => Buffer.from("not-an-image").buffer })

    await expect(toParserAcceptedFile(file)).rejects.toMatchObject({ code: applicationErrorCodes.validation })
  })

  it.each([
    ["application/pdf", 2 * 1024 * 1024 + 1],
    ["image/png", 4 * 1024 * 1024 + 1],
  ])("enforces the individual %s file size limit", (mimeType, fileSize) => {
    expect(() => ensureParserFileSize("invoice", mimeType, fileSize)).toThrow()
  })

  it("enforces the aggregate parser request size limit", () => {
    expect(() => ensureParserTotalFileSize([{ fileSize: 12 * 1024 * 1024 }, { fileSize: 12 * 1024 * 1024 }, { fileSize: 1 }])).toThrow()
  })

  it("normalizes path traversal and control characters before storage", () => {
    const storagePath = buildParserStoragePath("company", "batch", "item", "..\\..\\evil\n\".pdf")

    expect(storagePath.split("/").at(-1)).not.toBe("..")
    expect(storagePath).not.toMatch(/[\r\n\"\\]/)
  })

  it.each(["invoice\r\nX-Injected: yes.pdf", "..\\secret.pdf", "\u0000invoice.pdf"]) ("does not preserve unsafe filename %s", async (fileName) => {
    const acceptedFile = await toParserAcceptedFile(createFile({ name: fileName }))

    expect(acceptedFile.fileName).not.toMatch(/[\r\n\u0000\\]/)
    expect(acceptedFile.fileName).not.toContain("..")
  })
})
