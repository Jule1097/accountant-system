import { NextRequest, NextResponse } from "next/server"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { httpStatusCodes } from "src/lib/constants/http"
import { DashboardService } from "src/services/dashboard/Dashboard"
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id")

    if (!companyId) {
      return NextResponse.json({ error: apiResponseMessages.dashboard.activeCompanyRequired }, { status: httpStatusCodes.badRequest })
    }

    const dashboardService = new DashboardService()
    const recentActivity = await dashboardService.getRecentActivity(companyId)

    return NextResponse.json(recentActivity)
  } catch (error) {
    return resolveApplicationErrorResponse(error, { request, operation: "fetch dashboard recent activity", resource: "dashboard", workflow: "query", unexpectedMessage: apiResponseMessages.dashboard.activityLoadFailed })
  }
}
