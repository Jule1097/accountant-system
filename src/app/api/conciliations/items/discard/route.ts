import { NextRequest, NextResponse } from "next/server";
import { conciliationBulkDiscardSchema } from "src/lib/schemas/conciliations-schemas";
import { ConciliationsService } from "src/services/conciliations.service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const body = await request.json();
    const parsedBody = conciliationBulkDiscardSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Las facturas seleccionadas son inválidas" }, { status: 400 });
    }

    const conciliationsService = new ConciliationsService();
    const removedItems = await conciliationsService.discardItems(companyId, parsedBody.data.itemIds);

    return NextResponse.json({ removedItems }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error discarding multiple conciliation items:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudieron descartar las facturas seleccionadas" }, { status: 500 });
  }
}
