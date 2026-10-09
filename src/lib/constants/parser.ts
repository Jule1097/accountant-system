import { inputLimits } from "src/lib/constants/input-limits"

export const parserFileMimeTypes = {
  pdf: "application/pdf",
  png: "image/png",
  jpeg: "image/jpeg",
  unknown: "application/octet-stream",
} as const

export const parserImageMimeTypes = [parserFileMimeTypes.png, parserFileMimeTypes.jpeg] as const

export const parserFileExtensions = {
  pdf: ".pdf",
  png: ".png",
  jpeg: [".jpg", ".jpeg"],
} as const

export const parserBytesPerMegabyte = 1024 * 1024
export const parserHashAlgorithm = "sha256"

export const parserFileSizeLimits = {
  pdf: 2 * parserBytesPerMegabyte,
  image: 4 * parserBytesPerMegabyte,
  total: inputLimits.maxParserRequestBytes,
} as const

export const parserFileSignatures = {
  pdf: "%PDF-",
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpeg: [0xff, 0xd8, 0xff],
} as const

export const parserStorageEnvironmentVariables = {
  tempBucket: "VOUCHER_PARSER_TEMP_BUCKET",
} as const

export const parserResponseModes = {
  single: "single",
  batch: "batch",
} as const

export const parserFileValidationMessages = {
  maxFilesExceeded: `Se permiten hasta ${inputLimits.maxParserFiles} archivos por carga.`,
  pdfSizeExceeded: (fileName: string) => `El archivo ${fileName} excede el límite de ${parserFileSizeLimits.pdf / parserBytesPerMegabyte}MB para PDFs.`,
  imageSizeExceeded: (fileName: string) => `El archivo ${fileName} excede el límite de ${parserFileSizeLimits.image / parserBytesPerMegabyte}MB para imágenes.`,
  unsupportedType: (fileName: string) => `El archivo ${fileName} tiene un tipo no soportado.`,
  contentMismatch: (fileName: string) => `El contenido del archivo ${fileName} no coincide con su tipo declarado.`,
  duplicateFile: (fileName: string) => `El archivo ${fileName} está duplicado dentro del lote.`,
  totalSizeExceeded: `El tamaño total de los archivos no puede superar los ${parserFileSizeLimits.total / parserBytesPerMegabyte} MB.`,
} as const

export const parserInternalMessages = {
  storageOperationFailed: "Parser storage operation failed",
  temporaryObjectCleanupFailed: "Parser temporary object cleanup failed",
  uploadCleanupOperation: "confirm parser upload cleanup",
  storageProvider: "Supabase Storage",
  unknownErrorName: "UnknownError",
} as const

export const parserFailureMessages = {
  temporary_service: "El servicio de procesamiento no pudo completar la factura. Podés regenerarla.",
  unreadable_file: "No se pudo procesar el archivo. Podés regenerar la factura o revisar el archivo de origen.",
  preparation_failed: "No se pudo preparar el archivo para procesarlo. Podés regenerar la factura.",
  insufficient_extraction: "No se pudo extraer información suficiente de la factura. Podés regenerarla.",
  unknown: "No se pudo procesar la factura. Podés regenerarla.",
} as const

export const parserRetryMessages = {
  itemUnavailable: "La factura no está disponible para regeneración.",
  bulkSuccess: (requeuedItems: number, affectedBatches: number) => `Se reencolaron ${requeuedItems} facturas en ${affectedBatches} lotes.`,
  dispatchPending: (requeuedItems: number) => `Se reencolaron ${requeuedItems} facturas. El procesamiento comenzará cuando se recupere el envío.`,
} as const
