import { NextRequest, NextResponse } from 'next/server'
import { VoucherService } from 'src/services/voucher.service'
import { voucherSchema } from 'src/lib/schemas/voucher'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const searchParams = request.nextUrl.searchParams
    const filters: Record<string, unknown> = {}

    const type = searchParams.get('type')
    if (type) filters.type = type

    const voucherService = new VoucherService()
    const vouchers = await voucherService.getAllVouchers(companyId, filters)

    return NextResponse.json(vouchers)
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
