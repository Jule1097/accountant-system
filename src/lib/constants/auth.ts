export const requestContextErrorCodes = {
  unauthenticated: "UNAUTHENTICATED",
  companyRequired: "COMPANY_REQUIRED",
  companyForbidden: "COMPANY_FORBIDDEN",
} as const

export const requestContextHeaders = {
  activeCompanyId: "x-company-id",
} as const

export const requestContextErrorMessages = {
  unauthenticated: "Sesión inválida.",
  companyRequired: "Falta la empresa activa",
  companyForbidden: "No tienes acceso a la empresa activa.",
} as const

export type RequestContextErrorCode = typeof requestContextErrorCodes[keyof typeof requestContextErrorCodes]
