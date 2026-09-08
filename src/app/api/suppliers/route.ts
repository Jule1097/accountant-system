import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { httpStatusCodes } from 'src/lib/constants/http'
import { SupplierService } from 'src/services/third-party/Supplier'
import { shouldUseClientSupplierLegacyList } from 'src/lib/helpers/third-party/third-party-persistence'
import {
  parseClientSupplierListQuery,
} from 'src/lib/helpers/third-party/third-party-api'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'
import { clientSupplierSchema } from 'src/lib/schemas/third-party/third-party-schemas'

export async function GET(request: NextRequest) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const supplierService = new SupplierService()

    if (shouldUseClientSupplierLegacyList(request.nextUrl.searchParams)) {
      const suppliers = await supplierService.getAllSuppliers(companyId)
      return NextResponse.json(suppliers)
    }

    const queryParseResult = parseClientSupplierListQuery(request.nextUrl.searchParams)

    if (!queryParseResult.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidSearchParameters }, { status: httpStatusCodes.badRequest })
    }

    const { page, pageSize, ...filters } = queryParseResult.data
    const suppliers = await supplierService.getSupplierPage(companyId, page, pageSize, {
      ...filters,
    })

    return NextResponse.json(suppliers)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch suppliers', resource: 'supplier' }))
}

export async function POST(request: NextRequest) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const body = await request.json()

    const parsed = clientSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidData, details: parsed.error.format() }, { status: httpStatusCodes.badRequest })
    }

    const supplierService = new SupplierService()
    const newSupplier = await supplierService.createSupplier(companyId, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(newSupplier, { status: httpStatusCodes.created })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'create supplier', resource: 'supplier' }))
}
