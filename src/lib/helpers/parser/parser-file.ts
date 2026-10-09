import { createHash } from "node:crypto"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { inputLimits } from "src/lib/constants/input-limits"
import { parserFileExtensions, parserFileMimeTypes, parserFileSignatures, parserFileSizeLimits, parserFileValidationMessages, parserHashAlgorithm, parserImageMimeTypes } from "src/lib/constants/parser"
import { ApplicationError } from "src/lib/errors/application-error"
import { ParserVoucherType } from "src/types/parser/parser-batch"
import { ParserUploadFileMetadata } from "src/types/parser/parser-upload"

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

function hasPrefix(buffer: Buffer, prefix: Buffer): boolean {
  return buffer.subarray(0, prefix.length).equals(prefix)
}

function hasParserContentSignature(buffer: Buffer, mimeType: string): boolean {
  if (isParserPdfMimeType(mimeType)) return hasPrefix(buffer, Buffer.from(parserFileSignatures.pdf))
  if (mimeType === parserFileMimeTypes.png) return hasPrefix(buffer, Buffer.from([...parserFileSignatures.png]))
  if (mimeType === parserFileMimeTypes.jpeg) return hasPrefix(buffer, Buffer.from([...parserFileSignatures.jpeg]))
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
  if (normalizedName.endsWith(parserFileExtensions.pdf)) return parserFileMimeTypes.pdf
  if (normalizedName.endsWith(parserFileExtensions.png)) return parserFileMimeTypes.png
  if (parserFileExtensions.jpeg.some((extension) => normalizedName.endsWith(extension))) return parserFileMimeTypes.jpeg
  return parserFileMimeTypes.unknown
}

export function isParserPdfMimeType(mimeType: string): boolean {
  return mimeType === parserFileMimeTypes.pdf
}

export function isParserImageMimeType(mimeType: string): boolean {
  return parserImageMimeTypes.includes(mimeType as (typeof parserImageMimeTypes)[number])
}

export function ensureParserFileSize(fileName: string, mimeType: string, fileSize: number): void {
  const safeFileName = sanitizeParserFileName(fileName)
  if (isParserPdfMimeType(mimeType) && fileSize <= parserFileSizeLimits.pdf) return
  if (isParserImageMimeType(mimeType) && fileSize <= parserFileSizeLimits.image) return
  if (isParserPdfMimeType(mimeType)) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.pdfSizeExceeded(safeFileName), "Parser PDF file size validation failed")
  if (isParserImageMimeType(mimeType)) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.imageSizeExceeded(safeFileName), "Parser image file size validation failed")
  throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.unsupportedType(safeFileName), "Parser file type validation failed")
}

export function ensureParserFileCount(fileCount: number): void {
  if (fileCount > inputLimits.maxParserFiles) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.maxFilesExceeded, "Parser batch file limit validation failed")
}

export function ensureParserTotalFileSize(files: Pick<ParserAcceptedFile, "fileSize">[]): void {
  const totalFileSize = files.reduce((total, file) => total + file.fileSize, 0)
  if (totalFileSize > inputLimits.maxParserRequestBytes) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.totalSizeExceeded, "Parser aggregate file size validation failed")
}

export function buildParserFileHash(buffer: Buffer): string {
  return createHash(parserHashAlgorithm).update(buffer).digest("hex")
}

export function ensureParserUploadMetadata(files: ParserUploadFileMetadata[]): void {
  ensureParserFileCount(files.length)
  for (const file of files) ensureParserFileSize(file.fileName, file.mimeType, file.fileSize)
  ensureParserTotalFileSize(files)
}

export function ensureParserStoredFileMetadata(expected: ParserUploadFileMetadata, actual: Pick<ParserUploadFileMetadata, "mimeType" | "fileSize">): void {
  ensureParserFileSize(expected.fileName, actual.mimeType, actual.fileSize)
  if (expected.mimeType !== actual.mimeType || expected.fileSize !== actual.fileSize) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.contentMismatch(sanitizeParserFileName(expected.fileName)), "Parser stored file metadata validation failed")
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
  return createParserAcceptedFile(file.name, mimeType, buffer)
}

export function createParserAcceptedFile(fileName: string, mimeType: string, buffer: Buffer): ParserAcceptedFile {
  ensureParserFileSize(fileName, mimeType, buffer.length)
  if (!hasParserContentSignature(buffer, mimeType)) throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.contentMismatch(sanitizeParserFileName(fileName)), "Parser file content signature validation failed")
  return { fileName: sanitizeParserFileName(fileName), mimeType, fileSize: buffer.length, buffer, fileHash: buildParserFileHash(buffer) }
}
