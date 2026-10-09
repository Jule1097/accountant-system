import { NextRequest, NextResponse } from "next/server"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { httpStatusCodes } from "src/lib/constants/http"
import { parserResponseModes } from "src/lib/constants/parser"
import { parserUploadRequestContext } from "src/lib/constants/parser-upload"
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response"
import { readJsonBody } from "src/lib/helpers/api/request-body"
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler"
import { parserUploadConfirmationSchema } from "src/lib/schemas/parser/parser-upload-schemas"
import { VoucherParserService } from "src/services/parser/VoucherParser"

export async function POST(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId, userId }) => {
    const body = await readJsonBody(request)
    const parsedConfirmation = parserUploadConfirmationSchema.safeParse(body)
    if (!parsedConfirmation.success) return NextResponse.json({ error: apiResponseMessages.common.invalidRequestBody }, { status: httpStatusCodes.badRequest })
    const response = await new VoucherParserService().confirmUpload(companyId, userId, parsedConfirmation.data)
    if (response.mode === parserResponseModes.single) return NextResponse.json(response.data)
    return NextResponse.json(response, { status: httpStatusCodes.accepted })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: parserUploadRequestContext.confirmOperation, resource: parserUploadRequestContext.resource, workflow: parserUploadRequestContext.workflow }))
}
