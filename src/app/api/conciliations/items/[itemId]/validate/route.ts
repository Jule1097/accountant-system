import { NextRequest, NextResponse } from "next/server";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliations-schemas";
import { voucherSchema } from "src/lib/schemas/voucher-schemas";
import { ConciliationsService } from "src/services/conciliations.service";
import { VoucherFormPayload } from "src/types/voucher-form";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const params = await context.params;
    const parsedParams = conciliationItemParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: "El ítem solicitado es inválido" }, { status: 400 });
    }

    const body = await request.json();
    const payload = { ...body, companyId };
    const parsedPayload = voucherSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json({ error: "Los datos validados son inválidos" }, { status: 400 });
    }

    const conciliationsService = new ConciliationsService();
    const item = await conciliationsService.validateItem(
      companyId,
      parsedParams.data.itemId,
      parsedPayload.data as VoucherFormPayload
    );

    return NextResponse.json(item, { status: 202 });
  } catch (error: unknown) {
    console.error("Error validating conciliation item:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "No se pudo validar la factura" }, { status: 500 });
  }
}
