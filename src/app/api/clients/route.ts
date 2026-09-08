import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { httpStatusCodes } from 'src/lib/constants/http'
import { ClientService } from 'src/services/third-party/Client'
import { shouldUseClientSupplierLegacyList } from 'src/lib/helpers/third-party/third-party-persistence'
import {
  parseClientSupplierListQuery,
} from 'src/lib/helpers/third-party/third-party-api'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'
import { clientSupplierSchema } from 'src/lib/schemas/third-party/third-party-schemas'

export async function GET(request: NextRequest) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const clientService = new ClientService()

    if (shouldUseClientSupplierLegacyList(request.nextUrl.searchParams)) {
      const clients = await clientService.getAllClients(companyId)
      return NextResponse.json(clients)
    }

    const queryParseResult = parseClientSupplierListQuery(request.nextUrl.searchParams)

    if (!queryParseResult.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidSearchParameters }, { status: httpStatusCodes.badRequest })
    }

    const { page, pageSize, ...filters } = queryParseResult.data
    const clients = await clientService.getClientPage(companyId, page, pageSize, {
      ...filters,
    })

    return NextResponse.json(clients)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch clients', resource: 'client' }))
}

export async function POST(request: NextRequest) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const body = await request.json()

    const parsed = clientSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidData, details: parsed.error.format() }, { status: httpStatusCodes.badRequest })
    }

    const clientService = new ClientService()
    const newClient = await clientService.createClient(companyId, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(newClient, { status: httpStatusCodes.created })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'create client', resource: 'client' }))
}
