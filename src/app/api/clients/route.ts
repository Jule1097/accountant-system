import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from 'src/services/client.service'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  cuit: z.string().min(1, 'El CUIT es obligatorio'),
})

export async function GET(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const clientService = new ClientService()
    const clients = await clientService.getAllClients(companyId)

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')!
    const body = await request.json()

    const parsed = clientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const clientService = new ClientService()
    const newClient = await clientService.createClient(companyId, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(newClient, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error creating client:', err)
    if (err.message.includes('CUIT del cliente ya se encuentra registrado')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
