import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { CompanyNotificationService } from "src/services/company/CompanyNotification";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function GET(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const notificationService = new CompanyNotificationService();
    const notifications = await notificationService.listByCompany(companyId);
    return NextResponse.json(notifications);
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "fetch notifications", resource: "notifications", workflow: "query" }))
}
