import { NextRequest, NextResponse } from 'next/server'
import { SupplierService } from 'src/services/third-party/Supplier'
import { shouldUseClientSupplierLegacyList } from 'src/lib/helpers/third-party/third-party-persistence'
import {
  parseClientSupplierListQuery,
  resolveClientSupplierCollectionErrorResponse,
} from 'src/lib/helpers/third-party/third-party-api'
import { clientSupplierSchema } from 'src/lib/schemas/third-party/third-party-schemas'

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
