import { NextRequest, NextResponse } from 'next/server'
import { voucherSummaryQuerySchema } from 'src/lib/schemas/voucher-schemas'
import { VoucherService } from 'src/services/voucher.service'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get('x-company-id')

    if (!companyId) {
      return NextResponse.json({ error: 'Falta la empresa activa.' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Parámetros de búsqueda inválidos.' }, { status: 400 })
    }

    const voucherService = new VoucherService()
    const summary = await voucherService.getVoucherSummary(companyId, queryParseResult.data)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching voucher summary:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
