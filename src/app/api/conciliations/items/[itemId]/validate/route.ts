import { NextRequest, NextResponse } from "next/server";
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { httpStatusCodes } from "src/lib/constants/http";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliation/conciliations-schemas";
import { voucherSchema } from "src/lib/schemas/voucher/voucher-schemas";
import { normalizeVoucherFormPayload } from "src/lib/helpers/voucher/voucher-form";
import { ConciliationsService } from "src/services/conciliation/Conciliations";
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response";

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

    const body = await request.json();
    const payload = { ...body, companyId };
    const parsedPayload = voucherSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json({ error: apiResponseMessages.conciliation.invalidValidatedData }, { status: httpStatusCodes.badRequest });
    }

    const conciliationsService = new ConciliationsService();
    const item = await conciliationsService.validateItem(
      companyId,
      parsedParams.data.itemId,
      normalizeVoucherFormPayload({ ...parsedPayload.data, clientId: parsedPayload.data.clientId ?? null, supplierId: parsedPayload.data.supplierId ?? null, paymentDate: parsedPayload.data.paymentDate ?? null })
    );

    return NextResponse.json(item, { status: httpStatusCodes.accepted });
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "validate conciliation item", resource: "conciliation", workflow: "validate" }));
}
