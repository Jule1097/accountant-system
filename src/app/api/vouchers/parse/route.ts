import { NextRequest, NextResponse } from "next/server";
import { getParserAuthenticatedUserId } from "src/lib/helpers/parser-auth";
import { collectParserAcceptedFiles } from "src/lib/helpers/parser-file";
import { parserBatchUploadSchema } from "src/lib/schemas/parser-batch-schemas";
import { VoucherParserService } from "src/services/voucher-parser.service";

function resolveParserRequestError(error: Error): { status: number; message: string } {
  if (error.message === "Unauthorized") {
    return {
      status: 401,
      message: "Sesión inválida.",
    };
  }

  if (
    error.message.startsWith("El archivo ") ||
    error.message.startsWith("Se permiten hasta ") ||
    error.message.startsWith("No se proveyó ningún archivo") ||
    error.message.includes("está duplicado")
  ) {
    return {
      status: 400,
      message: error.message,
    };
  }

  return {
    status: 500,
    message: "Error procesando el documento",
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const formData = await request.formData();
    const parsedUpload = parserBatchUploadSchema.safeParse({
      voucherType: formData.get("voucherKind"),
    });

    if (!parsedUpload.success) {
      return NextResponse.json({ error: "El contexto del comprobante es inválido" }, { status: 400 });
    }

    const files = await collectParserAcceptedFiles(formData);

    if (!files.length) {
      return NextResponse.json({ error: "No se proveyó ningún archivo" }, { status: 400 });
    }

    const parserService = new VoucherParserService();

    if (files.length === 1) {
      const response = await parserService.parseSingleFile(companyId, parsedUpload.data.voucherType, files[0]);
      return NextResponse.json(response.data);
    }

    const userId = await getParserAuthenticatedUserId(request);
    const response = await parserService.createBatch(companyId, userId, parsedUpload.data.voucherType, files);

    return NextResponse.json(response, { status: 202 });
  } catch (error: unknown) {
    console.error("Error parsing document:", error);

    if (error instanceof Error) {
      const resolvedError = resolveParserRequestError(error);
      return NextResponse.json({ error: resolvedError.message }, { status: resolvedError.status });
    }

    return NextResponse.json({ error: "Error procesando el documento" }, { status: 500 });
  }
}
