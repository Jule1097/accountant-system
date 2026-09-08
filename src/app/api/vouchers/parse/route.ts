import { NextRequest, NextResponse } from "next/server"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { httpStatusCodes } from "src/lib/constants/http"
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response"
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler"
import { collectParserAcceptedFiles } from "src/lib/helpers/parser/parser-file"
import { parserBatchUploadSchema } from "src/lib/schemas/parser/parser-batch-schemas"
import { VoucherParserService } from "src/services/parser/VoucherParser"

export async function POST(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId, userId }) => {
    const formData = await request.formData()
    const parsedUpload = parserBatchUploadSchema.safeParse({ voucherType: formData.get("voucherKind") })
    if (!parsedUpload.success) return NextResponse.json({ error: apiResponseMessages.voucher.parseContextInvalid }, { status: httpStatusCodes.badRequest })
    const files = await collectParserAcceptedFiles(formData)
    if (!files.length) return NextResponse.json({ error: apiResponseMessages.voucher.parseNoFiles }, { status: httpStatusCodes.badRequest })
    const parserService = new VoucherParserService()
    if (files.length === 1) {
      const response = await parserService.parseSingleFile(companyId, parsedUpload.data.voucherType, files[0])
      return NextResponse.json(response.data)
    }
    const response = await parserService.createBatch(companyId, userId, parsedUpload.data.voucherType, files)
    return NextResponse.json(response, { status: httpStatusCodes.accepted })
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "parse voucher document", resource: "voucher", workflow: "parser" }))
}
