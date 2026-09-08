export const applicationErrorCodes = {
  validation: "VALIDATION",
  unauthenticated: "UNAUTHENTICATED",
  forbidden: "FORBIDDEN",
  notFound: "NOT_FOUND",
  duplicate: "DUPLICATE",
  conflict: "CONFLICT",
  unexpected: "UNEXPECTED",
} as const

export const applicationErrorInternalMessages = {
  operationFailed: "Application operation failed",
} as const

export type ApplicationErrorCode = typeof applicationErrorCodes[keyof typeof applicationErrorCodes]
