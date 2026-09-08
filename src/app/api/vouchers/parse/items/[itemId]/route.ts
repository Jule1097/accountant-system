import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { parserBatchRetrySchema } from "src/lib/schemas/parser/parser-batch-schemas";
import { VoucherParserService } from "src/services/parser/VoucherParser";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function GET(
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
    const item = await parserService.getItem(companyId, parsedQuery.data.itemId);

    if (!item) {
      return NextResponse.json({ error: apiResponseMessages.parser.itemNotFound }, { status: httpStatusCodes.notFound });
    }

    return NextResponse.json(item);
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "fetch parser item", resource: "parser item", workflow: "query" }));
}
