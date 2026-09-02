import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from 'src/services/third-party/Client'
import { resolveClientSupplierItemErrorResponse } from 'src/lib/helpers/third-party/third-party-api'
import { clientSupplierSchema } from 'src/lib/schemas/third-party/third-party-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = request.headers.get('x-company-id')!
    const clientService = new ClientService()
    const client = await clientService.getClientById(companyId, id)

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
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

    const parsed = clientSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const clientService = new ClientService()
    const updatedClient = await clientService.updateClient(companyId, id, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(updatedClient)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error updating client:', err)
    return resolveClientSupplierItemErrorResponse(err.message)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = request.headers.get('x-company-id')!
    const clientService = new ClientService()

    await clientService.deleteClient(companyId, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting client:', error)
    return resolveClientSupplierItemErrorResponse((error as Error).message)
  }
}
