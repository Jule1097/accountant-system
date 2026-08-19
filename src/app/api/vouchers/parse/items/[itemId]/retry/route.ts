import { NextRequest, NextResponse } from "next/server";
import { parserBatchRetrySchema } from "src/lib/schemas/parser-batch-schemas";
import { VoucherParserService } from "src/services/voucher-parser.service";

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
    const parsedQuery = parserBatchRetrySchema.safeParse(params);

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "El ítem solicitado es inválido" }, { status: 400 });
    }

    const parserService = new VoucherParserService();
    const job = await parserService.retryItem(companyId, parsedQuery.data.itemId);

    return NextResponse.json(job, { status: 202 });
  } catch (error: unknown) {
    console.error("Error retrying parser item:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "No se pudo reintentar el ítem" }, { status: 500 });
  }
}
