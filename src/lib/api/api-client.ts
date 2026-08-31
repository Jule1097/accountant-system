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

async function parseErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function resolveErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload) {
    return payload
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
