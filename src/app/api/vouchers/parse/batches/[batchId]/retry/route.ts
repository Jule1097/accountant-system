import { NextRequest, NextResponse } from "next/server";
import { parserBatchStatusQuerySchema } from "src/lib/schemas/parser-batch-schemas";
import { VoucherParserService } from "src/services/voucher-parser.service";

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
      return NextResponse.json({ error: "El batch solicitado es inválido" }, { status: 400 });
    }

    const parserService = new VoucherParserService();
    await parserService.retryBatch(companyId, parsedParams.data.batchId);

    return NextResponse.json({ batchId: parsedParams.data.batchId }, { status: 202 });
  } catch (error: unknown) {
    console.error("Error retrying parser batch:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "No se pudo reintentar el batch" }, { status: 500 });
  }
}
