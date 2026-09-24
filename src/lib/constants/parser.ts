export const parserFileValidationMessages = {
  pdfSizeExceeded: (fileName: string) => `El archivo ${fileName} excede el límite de 2MB para PDFs.`,
  imageSizeExceeded: (fileName: string) => `El archivo ${fileName} excede el límite de 4MB para imágenes.`,
  unsupportedType: (fileName: string) => `El archivo ${fileName} tiene un tipo no soportado.`,
  contentMismatch: (fileName: string) => `El contenido del archivo ${fileName} no coincide con su tipo declarado.`,
  totalSizeExceeded: "El tamaño total de los archivos no puede superar los 24 MB.",
} as const

export const parserInternalMessages = {
  storageOperationFailed: "Parser storage operation failed",
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
