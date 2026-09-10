import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliation/conciliations-schemas";
import { ConciliationsService } from "src/services/conciliation/Conciliations";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";
import { sanitizeParserFileName } from "src/lib/helpers/parser/parser-file";

export async function GET(
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
    const sourceFile = await conciliationsService.getSourceFile(companyId, parsedParams.data.itemId);

    return new NextResponse(new Uint8Array(sourceFile.buffer), {
      status: httpStatusCodes.ok,
      headers: {
        "Content-Type": sourceFile.mimeType,
        "Content-Disposition": `inline; filename="${sanitizeParserFileName(sourceFile.fileName)}"`,
      },
    });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "fetch conciliation source file", resource: "conciliation", workflow: "source" }));
}
