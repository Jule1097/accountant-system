import { NextRequest, NextResponse } from 'next/server'
import { VoucherService } from 'src/services/voucher.service'
import { voucherSchema } from 'src/lib/schemas/voucher-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = request.headers.get('x-company-id')!
    const voucherService = new VoucherService()
    const voucher = await voucherService.getVoucherById(companyId, id)
    
    if (!voucher) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(voucher)
  } catch (error) {
    console.error('Error fetching voucher:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = request.headers.get('x-company-id')!
    const body = await request.json()
    
    const payload = { ...body, companyId }
    
    const parsed = voucherSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const voucherService = new VoucherService()
    const updatedVoucher = await voucherService.updateVoucher(companyId, id, parsed.data)
    
    return NextResponse.json(updatedVoucher)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error updating voucher:', err)
    if (err.message === 'Voucher not found') {
      return NextResponse.json({ error: 'Comprobante no encontrado.' }, { status: 404 })
    }
    if (err.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Comprobante duplicado detectado.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = request.headers.get('x-company-id')!
    const voucherService = new VoucherService()
    
    await voucherService.deleteVoucher(companyId, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting voucher:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
