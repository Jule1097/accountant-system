import { NextRequest } from 'next/server'
import { DELETE, GET, PUT } from 'src/app/api/vouchers/[id]/route'
import { GET as GET_VOUCHERS, POST } from 'src/app/api/vouchers/route'
import { GET as GET_SUMMARY } from 'src/app/api/vouchers/summary/route'
import { applicationErrorCodes } from 'src/lib/constants/application-error'
import { ApplicationError } from 'src/lib/errors/application-error'
import { VoucherService } from 'src/services/voucher/Voucher'

jest.mock('src/services/voucher/Voucher')
jest.mock('src/lib/helpers/auth/request-context', () => {
  const { RequestContextError } = jest.requireActual('src/lib/errors/request-context')
  const { requestContextErrorCodes } = jest.requireActual('src/lib/constants/auth')
  return {
    requireRequestContext: jest.fn(async (request: NextRequest) => {
      const companyId = request.headers.get('x-company-id')
      if (!companyId) throw new RequestContextError(requestContextErrorCodes.companyRequired)
      return { userId: 'user-1', companyId }
    }),
  }
})

function createRequest(overrides: Partial<NextRequest> = {}) {
  return {
    headers: { get: () => '123e4567-e89b-12d3-a456-426614174000' },
    json: async () => ({}),
    nextUrl: { searchParams: new URLSearchParams() },
    ...overrides,
  } as NextRequest
}

describe('Voucher API Route Handlers', () => {
  const voucherServiceMock = VoucherService as jest.MockedClass<typeof VoucherService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 409 when create detects a duplicate voucher', async () => {
    voucherServiceMock.prototype.createVoucher = jest
      .fn()
      .mockRejectedValue(new ApplicationError(applicationErrorCodes.duplicate, 'Comprobante duplicado detectado.'))

    const request = createRequest({
      json: async () => ({
        type: 'sale',
        voucherTypeId: '123e4567-e89b-12d3-a456-426614174001',
        voucherLetterId: '123e4567-e89b-12d3-a456-426614174002',
        posNumber: '1',
        number: '123',
        clientId: '123e4567-e89b-12d3-a456-426614174003',
        date: '2026-08-08',
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
        paymentMethod: 'Transferencia',
        status: 'pending',
        createdByUserId: '123e4567-e89b-12d3-a456-426614174004',
        retentions: [],
        perceptions: [],
        vatDetails: [],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'Comprobante duplicado detectado.' })
  })

  it('returns 404 when voucher detail does not exist', async () => {
    voucherServiceMock.prototype.getVoucherById = jest.fn().mockResolvedValue(null)

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'missing-id' }),
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Comprobante no encontrado' })
  })

  it('returns 404 when update targets a missing voucher', async () => {
    voucherServiceMock.prototype.updateVoucher = jest.fn().mockRejectedValue(new ApplicationError(applicationErrorCodes.notFound, 'Comprobante no encontrado.'))

    const request = createRequest({
      json: async () => ({
        type: 'purchase',
        voucherTypeId: '123e4567-e89b-12d3-a456-426614174001',
        voucherLetterId: '123e4567-e89b-12d3-a456-426614174002',
        posNumber: '1',
        number: '123',
        supplierId: '123e4567-e89b-12d3-a456-426614174003',
        date: '2026-08-08',
        currency: '$',
        exchangeRate: 1,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
        paymentMethod: 'Transferencia',
        status: 'pending',
        createdByUserId: '123e4567-e89b-12d3-a456-426614174004',
        retentions: [],
        perceptions: [],
        vatDetails: [],
      }),
    })

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'missing-id' }),
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Comprobante no encontrado.' })
  })

  it('returns 404 when delete targets a missing voucher', async () => {
    voucherServiceMock.prototype.deleteVoucher = jest.fn().mockRejectedValue(new ApplicationError(applicationErrorCodes.notFound, 'Comprobante no encontrado.'))

    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ id: 'missing-id' }),
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Comprobante no encontrado.' })
  })

  it('keeps filtered summary queries company-scoped and currency-specific', async () => {
    voucherServiceMock.prototype.getVoucherSummary = jest.fn().mockResolvedValue({
      totalCount: 1,
      documentTotal: { USD: 100 },
      cashTotal: { USD: 80 },
      topParty: { USD: { name: 'Proveedor', total: 80 } },
      pendingCount: 1,
      nonFiscalAmount: { USD: 0 },
    })
    const request = createRequest({
      nextUrl: { searchParams: new URLSearchParams('type=purchase&currency=USD&status=pending&dateFrom=2026-01-01&dateTo=2026-01-31') } as NextRequest['nextUrl'],
    })

    const response = await GET_SUMMARY(request)

    expect(response.status).toBe(200)
    expect(voucherServiceMock.prototype.getVoucherSummary).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', expect.objectContaining({ type: 'purchase', currency: 'USD', status: 'pending' }))
  })

  it('omits the currency filter when the request selects all currencies', async () => {
    voucherServiceMock.prototype.getVoucherSummary = jest.fn().mockResolvedValue({
      totalCount: 2,
      documentTotal: { ARS: 100, USD: 50 },
      cashTotal: { ARS: 80, USD: 40 },
      topParty: {},
      pendingCount: 0,
      nonFiscalAmount: {},
    })
    const request = createRequest({
      nextUrl: { searchParams: new URLSearchParams('type=purchase&currency=') } as NextRequest['nextUrl'],
    })

    const response = await GET_SUMMARY(request)

    expect(response.status).toBe(200)
    expect(voucherServiceMock.prototype.getVoucherSummary).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', { type: 'purchase', sortBy: 'date', sortOrder: 'desc' })
  })

  it('omits the currency filter from voucher list requests when the request selects all currencies', async () => {
    voucherServiceMock.prototype.getVoucherPage = jest.fn().mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
    const request = createRequest({
      nextUrl: { searchParams: new URLSearchParams('type=sale&currency=') } as NextRequest['nextUrl'],
    })

    const response = await GET_VOUCHERS(request)

    expect(response.status).toBe(200)
    expect(voucherServiceMock.prototype.getVoucherPage).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 1, 10, { type: 'sale', sortBy: 'date', sortOrder: 'desc' })
  })
})
