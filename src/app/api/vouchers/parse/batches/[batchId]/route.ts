import { NextRequest, NextResponse } from "next/server";
import { parserBatchStatusQuerySchema } from "src/lib/schemas/parser-batch-schemas";
import { VoucherParserService } from "src/services/voucher-parser.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const params = await context.params;
    const parsedQuery = parserBatchStatusQuerySchema.safeParse(params);

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "El lote solicitado es inválido" }, { status: 400 });
    }

    const parserService = new VoucherParserService();
    const batch = await parserService.getBatch(companyId, parsedQuery.data.batchId);

    if (!batch) {
      return NextResponse.json({ error: "No se encontró el lote solicitado" }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error: unknown) {
    console.error("Error fetching parser batch:", error);
    return NextResponse.json({ error: "No se pudo consultar el lote" }, { status: 500 });
  }
}
