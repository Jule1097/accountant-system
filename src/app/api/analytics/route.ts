import { NextRequest, NextResponse } from 'next/server'
import { executeRequestWithContext } from 'src/lib/helpers/api/request-handler'
import { AnalyticsService } from 'src/services/analytics/Analytics'
import { resolveApplicationErrorResponse } from 'src/lib/helpers/api/application-error-response'

export async function GET(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const analyticsService = new AnalyticsService()
    const analytics = await analyticsService.getAnalytics(companyId)
    return NextResponse.json(analytics)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: 'fetch analytics', resource: 'analytics', workflow: 'query' }))
}
