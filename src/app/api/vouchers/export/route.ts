import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { apiResponseMessages } from 'src/lib/constants/api-response'
import { httpStatusCodes } from 'src/lib/constants/http'
import { VoucherExportService } from 'src/services/voucher/VoucherExport'
import { voucherExportQuerySchema } from 'src/lib/schemas/voucher/voucher-export-schemas'
import { ExportQueryParams } from 'src/types/voucher/voucher-export'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'
import { sanitizeParserFileName } from 'src/lib/helpers/parser/parser-file'

export async function GET(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {

    const { searchParams } = request.nextUrl
    const queryData = {
      mode: searchParams.get('mode'),
      type: searchParams.get('type'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    }

    const parsed = voucherExportQuerySchema.safeParse(queryData)
    if (!parsed.success) {
      return NextResponse.json({ error: apiResponseMessages.common.invalidSearchParameters }, { status: httpStatusCodes.badRequest })
    }

    const exportService = new VoucherExportService()
    const params: ExportQueryParams = {
      mode: parsed.data.mode,
      type: parsed.data.type === 'sale' ? 'sales' : 'purchases',
      search: parsed.data.search,
      status: parsed.data.status,
      dateFrom: parsed.data.dateFrom,
      dateTo: parsed.data.dateTo,
      sortBy: parsed.data.sortBy,
      sortOrder: parsed.data.sortOrder,
    }

    if (parsed.data.type === 'purchase') {
      params.type = 'purchases'
    } else {
      params.type = 'sales'
    }

    const result = await exportService.exportVouchers(companyId, params)

    const response = new NextResponse(new Uint8Array(result.buffer), {
      status: httpStatusCodes.ok,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${sanitizeParserFileName(result.filename)}"`,
        'Access-Control-Expose-Headers': 'Content-Disposition',
      },
    })
    return response
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'export vouchers', resource: 'voucher', workflow: 'export' }))
}
