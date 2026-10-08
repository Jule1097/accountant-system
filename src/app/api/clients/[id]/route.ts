import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { httpStatusCodes } from 'src/lib/constants/http'
import { clientNotFoundError } from 'src/lib/constants/messages'
import { ClientService } from 'src/services/third-party/Client'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'
import { readJsonBody } from 'src/lib/helpers/api/request-body'
import { resolveZodValidationResponse } from 'src/lib/helpers/api/validation-response'
import { clientSupplierSchema } from 'src/lib/schemas/third-party/third-party-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const clientService = new ClientService()
    const client = await clientService.getClientById(companyId, id)

    if (!client) {
      return NextResponse.json({ error: clientNotFoundError }, { status: httpStatusCodes.notFound })
    }

    return NextResponse.json(client)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch client', resource: 'client' }))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const body = await readJsonBody(request)

    const parsed = clientSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return resolveZodValidationResponse(parsed.error)
    }

    const clientService = new ClientService()
    const updatedClient = await clientService.updateClient(companyId, id, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(updatedClient)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'update client', resource: 'client' }))
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const clientService = new ClientService()

    await clientService.deleteClient(companyId, id)
    return new NextResponse(null, { status: httpStatusCodes.noContent })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'delete client', resource: 'client' }))
}
