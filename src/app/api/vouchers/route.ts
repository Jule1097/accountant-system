import { NextRequest, NextResponse } from 'next/server'
import { VoucherService } from 'src/services/voucher.service'
import { voucherListQuerySchema, voucherSchema } from 'src/lib/schemas/voucher-schemas'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const queryParseResult = voucherListQuerySchema.safeParse({
      type: request.nextUrl.searchParams.get('type') || undefined,
      page: request.nextUrl.searchParams.get('page') || undefined,
      pageSize: request.nextUrl.searchParams.get('pageSize') || undefined,
      search: request.nextUrl.searchParams.get('search') || undefined,
      status: request.nextUrl.searchParams.get('status') || undefined,
      dateFrom: request.nextUrl.searchParams.get('dateFrom') || undefined,
      dateTo: request.nextUrl.searchParams.get('dateTo') || undefined,
      sortBy: request.nextUrl.searchParams.get('sortBy') || undefined,
      sortOrder: request.nextUrl.searchParams.get('sortOrder') || undefined,
    })

    if (!queryParseResult.success) {
      return NextResponse.json({ error: 'Parámetros de búsqueda inválidos.' }, { status: 400 })
    }

    const voucherService = new VoucherService()
    const { page, pageSize, ...filters } = queryParseResult.data
    const vouchers = await voucherService.getVoucherPage(companyId, page, pageSize, filters)

    return NextResponse.json(vouchers)
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const body = await request.json()

    const payload = { ...body, companyId }

    const parsed = voucherSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const voucherService = new VoucherService()
    const newVoucher = await voucherService.createVoucher(parsed.data)

    return NextResponse.json(newVoucher, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error creating voucher:', err)
    if (err.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Comprobante duplicado detectado.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
