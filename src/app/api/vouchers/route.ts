import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { httpStatusCodes } from 'src/lib/constants/http'
import { VoucherService } from 'src/services/voucher/Voucher'
import { voucherListQuerySchema, voucherSchema } from 'src/lib/schemas/voucher/voucher-schemas'
import { mapVoucherSchemaToDomainInput } from 'src/lib/helpers/voucher/voucher-factory-input'
import { serializeVoucher, serializeVoucherPage } from 'src/lib/helpers/voucher/voucher-serialization'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'

export async function GET(request: NextRequest) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const queryParseResult = voucherListQuerySchema.safeParse({
      type: request.nextUrl.searchParams.get('type') || undefined,
      page: request.nextUrl.searchParams.get('page') || undefined,
      pageSize: request.nextUrl.searchParams.get('pageSize') || undefined,
      search: request.nextUrl.searchParams.get('search') || undefined,
      status: request.nextUrl.searchParams.get('status') || undefined,
      dateFrom: request.nextUrl.searchParams.get('dateFrom') || undefined,
      dateTo: request.nextUrl.searchParams.get('dateTo') || undefined,
      sortBy: request.nextUrl.searchParams.get('sortBy') || undefined,
      sortOrder: request.nextUrl.searchParams.get('sortOrder') || undefined,
    })

    if (!queryParseResult.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidSearchParameters }, { status: httpStatusCodes.badRequest })
    }

    const voucherService = new VoucherService()
    const { page, pageSize, ...filters } = queryParseResult.data
    const vouchers = await voucherService.getVoucherPage(companyId, page, pageSize, filters)

    return NextResponse.json(serializeVoucherPage(vouchers))
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch vouchers', resource: 'voucher' }))
}

export async function POST(request: NextRequest) {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const body = await request.json()

    const payload = { ...body, companyId }

    const parsed = voucherSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidData, details: parsed.error.format() }, { status: httpStatusCodes.badRequest })
    }

    const voucherService = new VoucherService()
    const newVoucher = await voucherService.createVoucher(mapVoucherSchemaToDomainInput(parsed.data))

    return NextResponse.json(serializeVoucher(newVoucher), { status: httpStatusCodes.created })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'create voucher', resource: 'voucher' }))
}
