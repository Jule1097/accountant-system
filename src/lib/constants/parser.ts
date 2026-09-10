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
