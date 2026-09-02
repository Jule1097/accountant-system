import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from 'src/services/third-party/Client'
import { shouldUseClientSupplierLegacyList } from 'src/lib/helpers/third-party/third-party-persistence'
import {
  parseClientSupplierListQuery,
  resolveClientSupplierCollectionErrorResponse,
} from 'src/lib/helpers/third-party/third-party-api'
import { clientSupplierSchema } from 'src/lib/schemas/third-party/third-party-schemas'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const clientService = new ClientService()

    if (shouldUseClientSupplierLegacyList(request.nextUrl.searchParams)) {
      const clients = await clientService.getAllClients(companyId)
      return NextResponse.json(clients)
    }

    const queryParseResult = parseClientSupplierListQuery(request.nextUrl.searchParams)

    if (!queryParseResult.success) {
      return NextResponse.json({ error: 'Parámetros de búsqueda inválidos.' }, { status: 400 })
    }

    const { page, pageSize, ...filters } = queryParseResult.data
    const clients = await clientService.getClientPage(companyId, page, pageSize, {
      ...filters,
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
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

    const clientService = new ClientService()
    const newClient = await clientService.createClient(companyId, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(newClient, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error creating client:', err)
    return resolveClientSupplierCollectionErrorResponse(err.message)
  }
}
