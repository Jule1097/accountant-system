import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from 'src/services/client.service'
import { z } from 'zod'

const clientUpdateSchema = z.object({
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
    const clientService = new ClientService()
    const client = await clientService.getClientById(companyId, id)

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
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

    const parsed = clientUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const clientService = new ClientService()
    const updatedClient = await clientService.updateClient(companyId, id, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(updatedClient)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error updating client:', err)
    if (err.message.includes('CUIT del cliente ya se encuentra registrado')) {
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
    const clientService = new ClientService()

    await clientService.deleteClient(companyId, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
