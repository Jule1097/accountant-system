import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { conciliationBulkPersistSchema } from "src/lib/schemas/conciliation/conciliations-schemas";
import { VoucherPersistenceService } from "src/services/parser/VoucherPersistence";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function POST(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const body = await request.json();
    const parsedBody = conciliationBulkPersistSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.invalidSelectedItems }, { status: httpStatusCodes.badRequest });
    }

    const persistenceService = new VoucherPersistenceService();
    const queuedItems = await persistenceService.enqueueItems(companyId, parsedBody.data.itemIds);

    return NextResponse.json({ queuedItems }, { status: httpStatusCodes.accepted });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "persist selected conciliation items", resource: "conciliation", workflow: "persist" }));
}
