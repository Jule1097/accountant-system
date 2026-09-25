import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { parserBulkRetrySchema } from "src/lib/schemas/parser/parser-batch-schemas";
import { VoucherParserService } from "src/services/parser/VoucherParser";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

export async function POST(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const body = await request.json();
    const parsedBody = parserBulkRetrySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: apiResponseMessages.parser.bulkRetryInvalid }, { status: httpStatusCodes.badRequest });
    }

    const parserService = new VoucherParserService();
    const result = await parserService.retryItems(companyId, parsedBody.data.itemIds);

    return NextResponse.json(result, { status: httpStatusCodes.accepted });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "retry selected parser items", resource: "parser item", workflow: "retry" }));
}
