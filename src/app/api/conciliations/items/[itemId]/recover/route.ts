import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliation/conciliations-schemas";
import { voucherSchema } from "src/lib/schemas/voucher/voucher-schemas";
import { mapVoucherSchemaToDomainInput } from "src/lib/helpers/voucher/voucher-factory-input";
import { ConciliationsService } from "src/services/conciliation/Conciliations";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";
import { readJsonBody } from "src/lib/helpers/api/request-body";
import { resolveZodValidationResponse } from "src/lib/helpers/api/validation-response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const params = await context.params;
    const parsedParams = conciliationItemParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.invalidItem }, { status: httpStatusCodes.badRequest });
    }

    const body = await readJsonBody(request);
    const parsedPayload = voucherSchema.safeParse({ ...body, companyId });

    if (!parsedPayload.success) {
      return resolveZodValidationResponse(parsedPayload.error);
    }

    const conciliationsService = new ConciliationsService();
    const result = await conciliationsService.recoverFailedItem(
      companyId,
      parsedParams.data.itemId,
      mapVoucherSchemaToDomainInput(parsedPayload.data),
    );

    return NextResponse.json(result, { status: httpStatusCodes.ok });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "recover conciliation item", resource: "conciliation", workflow: "recover" }));
}
