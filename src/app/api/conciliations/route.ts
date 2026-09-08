import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { conciliationsQuerySchema } from "src/lib/schemas/conciliation/conciliations-schemas";
import { ConciliationsService } from "src/services/conciliation/Conciliations";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function GET(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const url = new URL(request.url);
    const parsedQuery = conciliationsQuerySchema.safeParse({
      batchId: url.searchParams.get("batchId") || undefined,
      tab: url.searchParams.get("tab") || "sales",
      page: url.searchParams.get("page") || "1",
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.searchInvalid }, { status: httpStatusCodes.badRequest });
    }

    const conciliationsService = new ConciliationsService();
    const page = await conciliationsService.getPage(
      companyId,
      parsedQuery.data.batchId,
      parsedQuery.data.tab,
      parsedQuery.data.page
    );

    return NextResponse.json(page);
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "fetch conciliations", resource: "conciliation", workflow: "query", unexpectedMessage: apiResponseMessages.conciliation.loadFailed }))
}
