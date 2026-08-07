import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from 'src/services/analytics.service'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get('x-company-id')
    if (!companyId) {
      return NextResponse.json({ error: 'x-company-id header is missing' }, { status: 400 })
    }

    const analyticsService = new AnalyticsService()
    const analytics = await analyticsService.getAnalytics(companyId)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
