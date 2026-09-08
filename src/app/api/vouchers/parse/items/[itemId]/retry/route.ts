import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { parserBatchRetrySchema } from "src/lib/schemas/parser/parser-batch-schemas";
import { VoucherParserService } from "src/services/parser/VoucherParser";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const params = await context.params;
    const parsedQuery = parserBatchRetrySchema.safeParse(params);

    if (!parsedQuery.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.invalidItem }, { status: httpStatusCodes.badRequest });
    }

    const parserService = new VoucherParserService();
    const job = await parserService.retryItem(companyId, parsedQuery.data.itemId);

    return NextResponse.json(job, { status: httpStatusCodes.accepted });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "retry parser item", resource: "parser item", workflow: "retry" }));
}
