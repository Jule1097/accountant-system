import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { httpStatusCodes } from 'src/lib/constants/http'
import { supplierNotFoundError } from 'src/lib/constants/messages'
import { SupplierService } from 'src/services/third-party/Supplier'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'
import { clientSupplierSchema } from 'src/lib/schemas/third-party/third-party-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const supplierService = new SupplierService()
    const supplier = await supplierService.getSupplierById(companyId, id)

    if (!supplier) {
      return NextResponse.json({ error: supplierNotFoundError }, { status: httpStatusCodes.notFound })
    }

    return NextResponse.json(supplier)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch supplier', resource: 'supplier' }))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const body = await request.json()

    const parsed = clientSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidData, details: parsed.error.format() }, { status: httpStatusCodes.badRequest })
    }

    const supplierService = new SupplierService()
    const updatedSupplier = await supplierService.updateSupplier(companyId, id, parsed.data.name, parsed.data.cuit)

    return NextResponse.json(updatedSupplier)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'update supplier', resource: 'supplier' }))
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const supplierService = new SupplierService()

    await supplierService.deleteSupplier(companyId, id)
    return new NextResponse(null, { status: httpStatusCodes.noContent })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'delete supplier', resource: 'supplier' }))
}
