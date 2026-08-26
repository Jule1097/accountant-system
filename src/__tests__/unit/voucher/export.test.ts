import { NextRequest } from 'next/server'
import { GET } from 'src/app/api/vouchers/export/route'
import { VoucherExportService } from 'src/services/voucher/voucher-export.service'

jest.mock('src/services/voucher/voucher-export.service')

function createRequest(companyId: string | null, queryParams: Record<string, string>) {
  const headers = new Map()
  if (companyId) {
    headers.set('x-company-id', companyId)
  }
  const searchParams = new URLSearchParams(queryParams)

  return {
    headers: {
      get: (name: string) => headers.get(name) || null,
    },
    nextUrl: {
      searchParams,
    },
  } as unknown as NextRequest
}

describe('Voucher Export API Handler', () => {
  const exportServiceMock = VoucherExportService as jest.MockedClass<typeof VoucherExportService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when x-company-id header is missing', async () => {
    const request = createRequest(null, { mode: 'filters', type: 'sale' })
    const response = await GET(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('x-company-id')
  })

  it('returns 400 when query params are invalid', async () => {
    const request = createRequest('company-id', { mode: 'invalid-mode', type: 'sale' })
    const response = await GET(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Parámetros de búsqueda inválidos.')
  })

  it('calls exportVouchers service and returns spreadsheet on success', async () => {
    const expectedBuffer = Buffer.from('mock-excel-content')
    const expectedFilename = 'Ventas_TEEM_Filtrado_2026-08-23.xlsx'

    exportServiceMock.prototype.exportVouchers = jest.fn().mockResolvedValue({
      filename: expectedFilename,
      buffer: expectedBuffer,
    })

    const request = createRequest('company-id', { mode: 'filters', type: 'sale' })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(response.headers.get('Content-Disposition')).toBe(`attachment; filename="${expectedFilename}"`)

    const ab = await response.arrayBuffer()
    const content = Buffer.from(ab)
    expect(content).toEqual(expectedBuffer)
  })
})
