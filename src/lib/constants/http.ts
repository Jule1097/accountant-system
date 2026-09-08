export const httpMethods = {
  post: "POST",
  put: "PUT",
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
  notFound: 404,
  conflict: 409,
  internalServerError: 500,
} as const
