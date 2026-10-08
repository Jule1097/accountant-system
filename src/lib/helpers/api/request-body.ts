import { apiResponseMessages } from "src/lib/constants/api-response"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { ApplicationError } from "src/lib/errors/application-error"

async function readRequestBody<T>(reader: () => Promise<T>, publicMessage: string, diagnosticMessage: string): Promise<T> {
  try {
    return await reader()
  } catch {
    throw new ApplicationError(applicationErrorCodes.validation, publicMessage, diagnosticMessage)
  }
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const body = await readRequestBody(() => request.json(), apiResponseMessages.common.invalidRequestBody, "Request JSON parsing failed")
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new ApplicationError(applicationErrorCodes.validation, apiResponseMessages.common.invalidRequestBody, "Request JSON object validation failed")
  return body as Record<string, unknown>
}

export function readFormData(request: Request): Promise<FormData> {
  return readRequestBody(() => request.formData(), apiResponseMessages.common.invalidMultipartBody, "Request multipart parsing failed")
}
