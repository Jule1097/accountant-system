import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliation/conciliations-schemas";
import { VoucherPersistenceService } from "src/services/parser/VoucherPersistence";
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

    const persistenceService = new VoucherPersistenceService();
    const result = await persistenceService.persistItem(companyId, parsedParams.data.itemId);

    return NextResponse.json(result, { status: httpStatusCodes.ok });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "persist conciliation item", resource: "conciliation", workflow: "persist" }));
}
