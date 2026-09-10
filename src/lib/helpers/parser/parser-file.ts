import { createHash } from "node:crypto"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { inputLimits } from "src/lib/constants/input-limits"
import { parserFileValidationMessages } from "src/lib/constants/parser"
import { ApplicationError } from "src/lib/errors/application-error"
import { ParserVoucherType } from "src/types/parser/parser-batch"

const maxPdfFileSizeBytes = 2 * 1024 * 1024
const maxImageFileSizeBytes = 4 * 1024 * 1024
const acceptedImageMimeTypes = ["image/png", "image/jpeg"]
const parserFileNameFallback = "archivo"
const parserFileNameUnsafeCharacters = /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g
const parserFileNameAllowedCharacters = /[^\p{L}\p{N}._ -]/gu

export interface ParserAcceptedFile {
  fileName: string
  mimeType: string
  fileSize: number
  buffer: Buffer
  fileHash: string
}

function isParserFileEntry(value: FormDataEntryValue): value is File {
  return typeof value === "object" && "arrayBuffer" in value && "name" in value
}

function hasPrefix(buffer: Buffer, prefix: Buffer): boolean {
  return buffer.subarray(0, prefix.length).equals(prefix)
}

function hasParserContentSignature(buffer: Buffer, mimeType: string): boolean {
  if (isParserPdfMimeType(mimeType)) return hasPrefix(buffer, Buffer.from("%PDF-"))
  if (mimeType === "image/png") return hasPrefix(buffer, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mimeType === "image/jpeg") return hasPrefix(buffer, Buffer.from([0xff, 0xd8, 0xff]))
  return false
}

export function sanitizeParserFileName(fileName: string): string {
  const normalizedName = fileName.normalize("NFKC").replace(parserFileNameUnsafeCharacters, "")
  const baseName = (normalizedName.split(/[\\/]/).pop() || parserFileNameFallback).split(/["']/)[0]
  const sanitizedName = baseName.replace(parserFileNameAllowedCharacters, "_").replace(/\s+/g, " ").trim().replace(/^\.+/, "")
  return (sanitizedName || parserFileNameFallback).slice(0, inputLimits.maxNameLength)
}

export function resolveParserMimeType(file: File): string {
  if (file.type) return file.type
  const normalizedName = file.name.toLowerCase()
  if (normalizedName.endsWith(".pdf")) return "application/pdf"
  if (normalizedName.endsWith(".png")) return "image/png"
  if (normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg")) return "image/jpeg"
  return "application/octet-stream"
}

export function isParserPdfMimeType(mimeType: string): boolean {
  return mimeType === "application/pdf"
}

export function isParserImageMimeType(mimeType: string): boolean {
  return acceptedImageMimeTypes.includes(mimeType)
}

export function ensureParserFileSize(fileName: string, mimeType: string, fileSize: number): void {
  const safeFileName = sanitizeParserFileName(fileName)
  if (isParserPdfMimeType(mimeType) && fileSize <= maxPdfFileSizeBytes) return
  if (isParserImageMimeType(mimeType) && fileSize <= maxImageFileSizeBytes) return
  if (isParserPdfMimeType(mimeType)) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.pdfSizeExceeded(safeFileName), "Parser PDF file size validation failed")
  if (isParserImageMimeType(mimeType)) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.imageSizeExceeded(safeFileName), "Parser image file size validation failed")
  throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.unsupportedType(safeFileName), "Parser file type validation failed")
}

export function ensureParserTotalFileSize(files: Pick<ParserAcceptedFile, "fileSize">[]): void {
  const totalFileSize = files.reduce((total, file) => total + file.fileSize, 0)
  if (totalFileSize > inputLimits.maxParserRequestBytes) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.totalSizeExceeded, "Parser aggregate file size validation failed")
}

export function buildParserFileHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex")
}

export function buildParserStoragePath(companyId: string, batchId: string, itemId: string, fileName: string): string {
  return `${companyId}/${batchId}/${itemId}/${sanitizeParserFileName(fileName).replace(/[^\w.-]/g, "_")}`
}

export function resolveParserVoucherType(screenType: "sales" | "purchases"): ParserVoucherType {
  if (screenType === "sales") return "sale"
  return "purchase"
}

export async function toParserAcceptedFile(file: File): Promise<ParserAcceptedFile> {
  const mimeType = resolveParserMimeType(file)
  ensureParserFileSize(file.name, mimeType, file.size)
  const buffer = Buffer.from(await file.arrayBuffer())
  ensureParserFileSize(file.name, mimeType, buffer.length)
  if (!hasParserContentSignature(buffer, mimeType)) {
    throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.contentMismatch(sanitizeParserFileName(file.name)), "Parser file content signature validation failed")
  }
  return { fileName: sanitizeParserFileName(file.name), mimeType, fileSize: buffer.length, buffer, fileHash: buildParserFileHash(buffer) }
}

function getParserFormDataEntries(formData: FormData): FormDataEntryValue[] {
  const multiFileEntries = typeof formData.getAll === "function" ? formData.getAll("files") : []
  const singleFileEntry = formData.get("file")
  if (!singleFileEntry) return multiFileEntries
  return multiFileEntries.concat(singleFileEntry)
}

export async function collectParserAcceptedFiles(formData: FormData): Promise<ParserAcceptedFile[]> {
  const fileEntries = getParserFormDataEntries(formData).filter(isParserFileEntry)
  const acceptedFiles: ParserAcceptedFile[] = []
  for (const fileEntry of fileEntries) {
    ensureParserTotalFileSize([...acceptedFiles, { fileSize: fileEntry.size }])
    acceptedFiles.push(await toParserAcceptedFile(fileEntry))
    ensureParserTotalFileSize(acceptedFiles)
  }
  return acceptedFiles
}
