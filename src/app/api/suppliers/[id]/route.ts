import { NextRequest, NextResponse } from 'next/server'
import { SupplierService } from 'src/services/supplier.service'
import { z } from 'zod'

const supplierUpdateSchema = z.object({
  name: z.string().optional(),
  cuit: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = request.headers.get('x-company-id')!
    const supplierService = new SupplierService()
    const supplier = await supplierService.getSupplierById(companyId, id)

    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
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

    const parsed = supplierUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const supplierService = new SupplierService()
    const updatedSupplier = await supplierService.updateSupplier(companyId, id, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(updatedSupplier)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error updating supplier:', err)
    if (err.message.includes('CUIT del proveedor ya se encuentra registrado')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
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
    const supplierService = new SupplierService()

    await supplierService.deleteSupplier(companyId, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
