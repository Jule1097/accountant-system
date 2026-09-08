import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { httpStatusCodes } from 'src/lib/constants/http'
import { VoucherService } from 'src/services/voucher/Voucher'
import { voucherSchema } from 'src/lib/schemas/voucher/voucher-schemas'
import { mapVoucherSchemaToDomainInput } from 'src/lib/helpers/voucher/voucher-factory-input'
import { serializeVoucher } from 'src/lib/helpers/voucher/voucher-serialization'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const voucherService = new VoucherService()
    const voucher = await voucherService.getVoucherById(companyId, id)
    
    if (!voucher) {
      return NextResponse.json({ error: apiResponseMessages.voucher.notFound }, { status: httpStatusCodes.notFound })
    }
    
    return NextResponse.json(serializeVoucher(voucher))
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch voucher', resource: 'voucher' }))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const body = await request.json()
    
    const payload = { ...body, companyId }
    
    const parsed = voucherSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidData, details: parsed.error.format() }, { status: httpStatusCodes.badRequest })
    }

    const voucherService = new VoucherService()
    const updatedVoucher = await voucherService.updateVoucher(companyId, id, mapVoucherSchemaToDomainInput(parsed.data))
    
    return NextResponse.json(serializeVoucher(updatedVoucher))
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'update voucher', resource: 'voucher' }))
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const { id } = await params
    const voucherService = new VoucherService()
    
    await voucherService.deleteVoucher(companyId, id)
    return new NextResponse(null, { status: httpStatusCodes.noContent })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'delete voucher', resource: 'voucher' }))
}
