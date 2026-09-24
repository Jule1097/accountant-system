import { isError } from "src/lib/helpers/shared/type-guards"

export class ApiRequestError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.payload = payload
  }
}

export function isApiRequestError(value: unknown): value is ApiRequestError {
  return isError(value) && value.name === "ApiRequestError" && "status" in value && typeof value.status === "number"
}

export function resolveApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isApiRequestError(error)) {
    const payloadMessage = resolveErrorMessage(error.payload, error.status)
    if (!payloadMessage.startsWith("Request failed with status")) return payloadMessage
    if (error.message) return resolveSerializedErrorMessage(error.message) ?? error.message
  }

  if (isError(error)) return resolveSerializedErrorMessage(error.message) ?? error.message

  if (typeof error === "object" && error !== null && "error" in error && typeof error.error === "string" && error.error) return resolveSerializedErrorMessage(error.error) ?? error.error

  return fallbackMessage
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function resolveErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload) {
    return resolveSerializedErrorMessage(payload) ?? payload
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error
  }

  return `Request failed with status ${status}`
}

function resolveSerializedErrorMessage(value: string): string | null {
  try {
    const parsedValue: unknown = JSON.parse(value)
    if (typeof parsedValue === 'object' && parsedValue !== null && "error" in parsedValue && typeof parsedValue.error === 'string' && parsedValue.error) return parsedValue.error
  } catch {
    return null
  }

  return null
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {})

  if (typeof window !== 'undefined') {
    const activeCompanyId = localStorage.getItem('active_company_id')
    if (activeCompanyId && !headers.has('x-company-id')) {
      headers.set('x-company-id', activeCompanyId)
    }
  }

  const response = await fetch(path, {
    ...options,
    headers
  })

  if (!response.ok) {
    const payload = await parseErrorPayload(response)
    throw new ApiRequestError(resolveErrorMessage(payload, response.status), response.status, payload)
  }

  return response
}
