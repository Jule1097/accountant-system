import { NextRequest, NextResponse } from "next/server"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler"
import { DashboardService } from "src/services/dashboard/Dashboard"
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response"

export async function GET(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const dashboardService = new DashboardService()
    const recentActivity = await dashboardService.getRecentActivity(companyId)

    return NextResponse.json(recentActivity)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "fetch dashboard recent activity", resource: "dashboard", workflow: "query", unexpectedMessage: apiResponseMessages.dashboard.activityLoadFailed }))
}
