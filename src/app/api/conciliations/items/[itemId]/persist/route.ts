import { NextRequest, NextResponse } from "next/server";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliations-schemas";
import { VoucherPersistenceService } from "src/services/voucher-persistence.service";

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

    const persistenceService = new VoucherPersistenceService();
    const result = await persistenceService.persistItem(companyId, parsedParams.data.itemId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("Error persisting conciliation item:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudo persistir la factura" }, { status: 500 });
  }
}
