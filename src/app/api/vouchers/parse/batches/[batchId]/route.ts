import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { parserBatchStatusQuerySchema } from "src/lib/schemas/parser/parser-batch-schemas";
import { VoucherParserService } from "src/services/parser/VoucherParser";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const params = await context.params;
    const parsedQuery = parserBatchStatusQuerySchema.safeParse(params);

    if (!parsedQuery.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.invalidBatch }, { status: httpStatusCodes.badRequest });
    }

    const parserService = new VoucherParserService();
    const batch = await parserService.getBatch(companyId, parsedQuery.data.batchId);

    if (!batch) {
      return NextResponse.json({ error: apiResponseMessages.parser.batchNotFound }, { status: httpStatusCodes.notFound });
    }

    return NextResponse.json(batch);
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "fetch parser batch", resource: "parser batch", workflow: "query" }));
}
