import { NextRequest, NextResponse } from "next/server"
import { httpStatusCodes } from "src/lib/constants/http"
import { parserUploadRequestContext } from "src/lib/constants/parser-upload"
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response"
import { resolveParserUploadInitializationValidationMessage } from "src/lib/helpers/parser/parser-upload-api"
import { readJsonBody } from "src/lib/helpers/api/request-body"
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler"
import { parserUploadPlanSchema } from "src/lib/schemas/parser/parser-upload-schemas"
import { VoucherParserService } from "src/services/parser/VoucherParser"

export async function POST(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId, userId }) => {
    const body = await readJsonBody(request)
    const parsedPlan = parserUploadPlanSchema.safeParse(body)
    if (!parsedPlan.success) return NextResponse.json({ error: resolveParserUploadInitializationValidationMessage(parsedPlan.error.issues[0]?.message) }, { status: httpStatusCodes.badRequest })
    const response = await new VoucherParserService().createUploadPlan(companyId, userId, parsedPlan.data)
    return NextResponse.json(response, { status: httpStatusCodes.created })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: parserUploadRequestContext.initializeOperation, resource: parserUploadRequestContext.resource, workflow: parserUploadRequestContext.workflow }))
}
