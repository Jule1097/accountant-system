import { NextRequest, NextResponse } from "next/server";
import { parserBatchStatusQuerySchema } from "src/lib/schemas/parser-batch-schemas";
import { VoucherPersistenceService } from "src/services/voucher-persistence.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const params = await context.params;
    const parsedParams = parserBatchStatusQuerySchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: "El lote solicitado es inválido" }, { status: 400 });
    }

    const persistenceService = new VoucherPersistenceService();
    const queuedItems = await persistenceService.enqueueBatch(companyId, parsedParams.data.batchId);

    return NextResponse.json({ queuedItems }, { status: 202 });
  } catch (error: unknown) {
    console.error("Error enqueueing batch persistence:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudieron enviar las facturas a persistencia" }, { status: 500 });
  }
}
