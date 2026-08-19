import { NextRequest, NextResponse } from "next/server";
import { conciliationItemParamsSchema } from "src/lib/schemas/conciliations-schemas";
import { ConciliationsService } from "src/services/conciliations.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id") || request.nextUrl.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const params = await context.params;
    const parsedParams = conciliationItemParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json({ error: "El ítem solicitado es inválido" }, { status: 400 });
    }

    const conciliationsService = new ConciliationsService();
    const sourceFile = await conciliationsService.getSourceFile(companyId, parsedParams.data.itemId);

    return new NextResponse(new Uint8Array(sourceFile.buffer), {
      status: 200,
      headers: {
        "Content-Type": sourceFile.mimeType,
        "Content-Disposition": `inline; filename="${sourceFile.fileName}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching conciliation source file:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "No se pudo cargar el archivo fuente" }, { status: 500 });
  }
}
