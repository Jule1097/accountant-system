import { createHash } from "node:crypto";

import { ParserVoucherType } from "src/types/parser-batch";

const maxPdfFileSizeBytes = 2 * 1024 * 1024;
const maxImageFileSizeBytes = 4 * 1024 * 1024;
const acceptedImageMimeTypes = ["image/png", "image/jpeg"];

export interface ParserAcceptedFile {
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
  fileHash: string;
}

function isParserFileEntry(value: FormDataEntryValue): value is File {
  return typeof value === "object" && "arrayBuffer" in value && "name" in value;
}

export function resolveParserMimeType(file: File): string {
  if (file.type) {
    return file.type;
  }

  const normalizedName = file.name.toLowerCase();

  if (normalizedName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalizedName.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

export function isParserPdfMimeType(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function isParserImageMimeType(mimeType: string): boolean {
  return acceptedImageMimeTypes.includes(mimeType);
}

export function ensureParserFileSize(fileName: string, mimeType: string, fileSize: number): void {
  if (isParserPdfMimeType(mimeType) && fileSize <= maxPdfFileSizeBytes) {
    return;
  }

  if (isParserImageMimeType(mimeType) && fileSize <= maxImageFileSizeBytes) {
    return;
  }

  if (isParserPdfMimeType(mimeType)) {
    throw new Error(`El archivo ${fileName} excede el límite de 2MB para PDFs.`);
  }

  if (isParserImageMimeType(mimeType)) {
    throw new Error(`El archivo ${fileName} excede el límite de 4MB para imágenes.`);
  }

  throw new Error(`El archivo ${fileName} tiene un tipo no soportado.`);
}

export function buildParserFileHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function buildParserStoragePath(
  companyId: string,
  batchId: string,
  itemId: string,
  fileName: string
): string {
  const normalizedFileName = fileName.replace(/[^\w.-]/g, "_");
  return `${companyId}/${batchId}/${itemId}/${normalizedFileName}`;
}

export function resolveParserVoucherType(screenType: "sales" | "purchases"): ParserVoucherType {
  if (screenType === "sales") {
    return "sale";
  }

  return "purchase";
}

export async function toParserAcceptedFile(file: File): Promise<ParserAcceptedFile> {
  const mimeType = resolveParserMimeType(file);

  ensureParserFileSize(file.name, mimeType, file.size);

  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    fileName: file.name,
    mimeType,
    fileSize: file.size,
    buffer,
    fileHash: buildParserFileHash(buffer),
  };
}

function getParserFormDataEntries(formData: FormData): FormDataEntryValue[] {
  const multiFileEntries =
    typeof formData.getAll === "function" ? formData.getAll("files") : [];
  const singleFileEntry = formData.get("file");

  if (!singleFileEntry) {
    return multiFileEntries;
  }

  return multiFileEntries.concat(singleFileEntry);
}

export async function collectParserAcceptedFiles(formData: FormData): Promise<ParserAcceptedFile[]> {
  const fileEntries = getParserFormDataEntries(formData).filter(isParserFileEntry);
  const acceptedFiles: ParserAcceptedFile[] = [];

  for (const fileEntry of fileEntries) {
    acceptedFiles.push(await toParserAcceptedFile(fileEntry));
  }

  return acceptedFiles;
}
