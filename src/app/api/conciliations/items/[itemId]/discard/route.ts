import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliation/conciliations-schemas";
import { ConciliationsService } from "src/services/conciliation/Conciliations";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const params = await context.params;
    const parsedParams = conciliationItemParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.invalidItem }, { status: httpStatusCodes.badRequest });
    }

    const conciliationsService = new ConciliationsService();
    await conciliationsService.discardItem(companyId, parsedParams.data.itemId);

    return NextResponse.json({ success: true }, { status: httpStatusCodes.accepted });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "discard conciliation item", resource: "conciliation", workflow: "discard" }));
}
