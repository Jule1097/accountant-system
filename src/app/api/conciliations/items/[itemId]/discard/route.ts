import { NextRequest, NextResponse } from "next/server";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliations-schemas";
import { ConciliationsService } from "src/services/conciliations.service";

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

    const conciliationsService = new ConciliationsService();
    await conciliationsService.discardItem(companyId, parsedParams.data.itemId);

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error: unknown) {
    console.error("Error discarding conciliation item:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "No se pudo descartar la factura" }, { status: 500 });
  }
}
