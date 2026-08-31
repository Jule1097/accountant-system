import { NextRequest, NextResponse } from 'next/server'
import { VoucherExportService } from 'src/services/voucher/voucher-export.service'
import { voucherExportQuerySchema } from 'src/lib/schemas/voucher/voucher-export-schemas'
import { ExportQueryParams } from 'src/types/voucher/voucher-export'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get('x-company-id')
    if (!companyId) {
      return NextResponse.json({ error: 'x-company-id header is missing' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Parámetros de búsqueda inválidos.' }, { status: 400 })
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
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Access-Control-Expose-Headers': 'Content-Disposition',
      },
    })
    return response
  } catch (error) {
    console.error('Error generating Excel export:', error)
    return NextResponse.json({ error: 'Error interno del servidor al exportar Excel' }, { status: 500 })
  }
}
