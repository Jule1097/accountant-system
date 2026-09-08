import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { CompanyNotificationService } from "src/services/company/CompanyNotification";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ notificationId: string }> }
): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const params = await context.params;
    const notificationId = params.notificationId;

    if (!notificationId) {
      return NextResponse.json({ error: apiResponseMessages.notifications.invalid }, { status: httpStatusCodes.badRequest });
    }

    const notificationService = new CompanyNotificationService();
    await notificationService.deleteById(companyId, notificationId);

    return NextResponse.json({ success: true });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "delete notification", resource: "notification", workflow: "delete" }));
}
