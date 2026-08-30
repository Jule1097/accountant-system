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
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  return response
}
