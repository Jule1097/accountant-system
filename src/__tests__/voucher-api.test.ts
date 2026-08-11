import { NextRequest } from 'next/server'
import { DELETE, GET, PUT } from 'src/app/api/vouchers/[id]/route'
import { POST } from 'src/app/api/vouchers/route'
import { VoucherService } from 'src/services/voucher.service'

jest.mock('src/services/voucher.service')

function createRequest(overrides: Partial<NextRequest> = {}) {
  return {
    headers: { get: () => '123e4567-e89b-12d3-a456-426614174000' },
    json: async () => ({}),
    nextUrl: { searchParams: new URLSearchParams() },
    ...overrides,
  } as unknown as NextRequest
}

describe('Voucher API Route Handlers', () => {
  const voucherServiceMock = VoucherService as jest.MockedClass<typeof VoucherService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 409 when create detects a duplicate voucher', async () => {
    voucherServiceMock.prototype.createVoucher = jest
      .fn()
      .mockRejectedValue(new Error('Voucher is a duplicate of an existing record'))

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
    voucherServiceMock.prototype.updateVoucher = jest.fn().mockRejectedValue(new Error('Voucher not found'))

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
    voucherServiceMock.prototype.deleteVoucher = jest.fn().mockRejectedValue(new Error('Voucher not found'))

    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ id: 'missing-id' }),
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Comprobante no encontrado.' })
  })
})
