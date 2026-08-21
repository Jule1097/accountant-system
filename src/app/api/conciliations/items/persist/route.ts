import { NextRequest, NextResponse } from "next/server";
import { conciliationBulkPersistSchema } from "src/lib/schemas/conciliations-schemas";
import { VoucherPersistenceService } from "src/services/voucher-persistence.service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const body = await request.json();
    const parsedBody = conciliationBulkPersistSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Las facturas seleccionadas son inválidas" }, { status: 400 });
    }

    const persistenceService = new VoucherPersistenceService();
    const queuedItems = await persistenceService.enqueueItems(companyId, parsedBody.data.itemIds);

    return NextResponse.json({ queuedItems }, { status: 202 });
  } catch (error: unknown) {
    console.error("Error enqueueing selected conciliation items:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudieron enviar las facturas seleccionadas a guardar" }, { status: 500 });
  }
}
