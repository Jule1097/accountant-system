import { NextRequest, NextResponse } from 'next/server'
import { SupplierService } from 'src/services/client-supplier/supplier.service'
import { shouldUseClientSupplierLegacyList } from 'src/lib/helpers/client-supplier/client-supplier'
import {
  parseClientSupplierListQuery,
  resolveClientSupplierCollectionErrorResponse,
} from 'src/lib/helpers/client-supplier/client-supplier-api'
import { clientSupplierSchema } from 'src/lib/schemas/client-supplier/client-supplier-schemas'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const supplierService = new SupplierService()

    if (shouldUseClientSupplierLegacyList(request.nextUrl.searchParams)) {
      const suppliers = await supplierService.getAllSuppliers(companyId)
      return NextResponse.json(suppliers)
    }

    const queryParseResult = parseClientSupplierListQuery(request.nextUrl.searchParams)

    if (!queryParseResult.success) {
      return NextResponse.json({ error: 'Parámetros de búsqueda inválidos.' }, { status: 400 })
    }

    const { page, pageSize, ...filters } = queryParseResult.data
    const suppliers = await supplierService.getSupplierPage(companyId, page, pageSize, {
      ...filters,
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const body = await request.json()

    const parsed = clientSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const supplierService = new SupplierService()
    const newSupplier = await supplierService.createSupplier(companyId, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(newSupplier, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error creating supplier:', err)
    return resolveClientSupplierCollectionErrorResponse(err.message)
  }
}
