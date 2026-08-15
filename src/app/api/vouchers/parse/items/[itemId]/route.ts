import { NextRequest, NextResponse } from "next/server";
import { parserBatchRetrySchema } from "src/lib/schemas/parser-batch-schemas";
import { VoucherParserService } from "src/services/voucher-parser.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const params = await context.params;
    const parsedQuery = parserBatchRetrySchema.safeParse(params);

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "El ítem solicitado es inválido" }, { status: 400 });
    }

    const parserService = new VoucherParserService();
    const item = await parserService.getItem(companyId, parsedQuery.data.itemId);

    if (!item) {
      return NextResponse.json({ error: "No se encontró el ítem solicitado" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error("Error fetching parser item:", error);
    return NextResponse.json({ error: "No se pudo consultar el ítem" }, { status: 500 });
  }
}
