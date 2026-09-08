import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { httpStatusCodes } from 'src/lib/constants/http'
import { voucherSummaryQuerySchema } from 'src/lib/schemas/voucher/voucher-schemas'
import { VoucherService } from 'src/services/voucher/Voucher'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'

export async function GET(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const queryParseResult = voucherSummaryQuerySchema.safeParse({
      type: request.nextUrl.searchParams.get('type') || undefined,
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
    const summary = await voucherService.getVoucherSummary(companyId, queryParseResult.data)

    return NextResponse.json(summary)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch voucher summary', resource: 'voucher', workflow: 'summary' }))
}
