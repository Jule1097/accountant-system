import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { parserBatchStatusQuerySchema } from "src/lib/schemas/parser/parser-batch-schemas";
import { VoucherParserService } from "src/services/parser/VoucherParser";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const params = await context.params;
    const parsedParams = parserBatchStatusQuerySchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.invalidBatch }, { status: httpStatusCodes.badRequest });
    }

    const parserService = new VoucherParserService();
    await parserService.retryBatch(companyId, parsedParams.data.batchId);

    return NextResponse.json({ batchId: parsedParams.data.batchId }, { status: httpStatusCodes.accepted });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "retry parser batch", resource: "parser batch", workflow: "retry" }));
}
