export const parserUploadPlanDurationMs = 15 * 60 * 1000

export const parserUploadEnvironmentVariables = {
  planSecret: "PARSER_UPLOAD_PLAN_SECRET",
} as const

export const parserUploadTokenConfiguration = {
  partSeparator: ".",
  payloadEncoding: "base64url",
  textEncoding: "utf8",
} as const

export const parserUploadRequestContext = {
  initializeOperation: "initialize parser upload",
  confirmOperation: "confirm parser upload",
  resource: "voucher",
  workflow: "parser",
} as const

export const parserUploadMessages = {
  invalidPlan: "La carga de archivos expiró o no es válida.",
  ownershipDenied: "No tienes acceso a esta carga.",
  incompleteUpload: "La carga de archivos está incompleta.",
  storageFileMissing: "No se encontró uno de los archivos cargados.",
  directUploadFailed: "No se pudo cargar uno de los archivos.",
} as const
