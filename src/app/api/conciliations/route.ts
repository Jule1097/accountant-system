import { NextRequest, NextResponse } from "next/server";
import { conciliationsQuerySchema } from "src/lib/schemas/conciliations-schemas";
import { ConciliationsService } from "src/services/conciliations.service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const url = new URL(request.url);
    const parsedQuery = conciliationsQuerySchema.safeParse({
      batchId: url.searchParams.get("batchId") || undefined,
      tab: url.searchParams.get("tab") || "sales",
      page: url.searchParams.get("page") || "1",
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "La búsqueda de conciliaciones es inválida" }, { status: 400 });
    }

    const conciliationsService = new ConciliationsService();
    const page = await conciliationsService.getPage(
      companyId,
      parsedQuery.data.batchId,
      parsedQuery.data.tab,
      parsedQuery.data.page
    );

    return NextResponse.json(page);
  } catch (error: unknown) {
    console.error("Error fetching conciliations:", error);
    return NextResponse.json({ error: "No se pudieron cargar las conciliaciones" }, { status: 500 });
  }
}
