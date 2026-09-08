import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { conciliationBulkDiscardSchema } from "src/lib/schemas/conciliation/conciliations-schemas";
import { ConciliationsService } from "src/services/conciliation/Conciliations";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function POST(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const body = await request.json();
    const parsedBody = conciliationBulkDiscardSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.invalidSelectedItems }, { status: httpStatusCodes.badRequest });
    }

    const conciliationsService = new ConciliationsService();
    const removedItems = await conciliationsService.discardItems(companyId, parsedBody.data.itemIds);

    return NextResponse.json({ removedItems }, { status: httpStatusCodes.ok });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "discard selected conciliation items", resource: "conciliation", workflow: "discard" }));
}
