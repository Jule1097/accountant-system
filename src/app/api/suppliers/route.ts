import { NextRequest, NextResponse } from 'next/server'
import { SupplierService } from 'src/services/supplier.service'
import { supplierSchema } from 'src/lib/schemas/voucher-schemas'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const supplierService = new SupplierService()
    const suppliers = await supplierService.getAllSuppliers(companyId)

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const body = await request.json()

    const parsed = supplierSchema.safeParse({ ...body, companyId })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const supplierService = new SupplierService()
    const newSupplier = await supplierService.createSupplier(companyId, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(newSupplier, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error creating supplier:', err)
    if (err.message.includes('CUIT del proveedor ya se encuentra registrado')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
