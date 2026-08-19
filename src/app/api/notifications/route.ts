import { NextRequest, NextResponse } from "next/server";
import { CompanyNotificationService } from "src/services/company-notification.service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const notificationService = new CompanyNotificationService();
    const notifications = await notificationService.listByCompany(companyId);

    return NextResponse.json(notifications);
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "No se pudieron cargar las notificaciones" }, { status: 500 });
  }
}
