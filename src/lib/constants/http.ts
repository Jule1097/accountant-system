export const httpMethods = {
  post: "POST",
  put: "PUT",
  patch: "PATCH",
  delete: "DELETE",
} as const

export const contentTypes = {
  json: "application/json",
} as const

export const httpStatusCodes = {
  ok: 200,
  created: 201,
  accepted: 202,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  tooManyRequests: 429,
  notFound: 404,
  conflict: 409,
  internalServerError: 500,
} as const
