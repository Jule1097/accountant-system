import { NextRequest, NextResponse } from "next/server";
import { CompanyNotificationService } from "src/services/company-notification.service";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ notificationId: string }> }
): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id");

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 });
    }

    const params = await context.params;
    const notificationId = params.notificationId;

    if (!notificationId) {
      return NextResponse.json({ error: "La notificación es inválida" }, { status: 400 });
    }

    const notificationService = new CompanyNotificationService();
    await notificationService.deleteById(companyId, notificationId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "No se pudo borrar la notificación" }, { status: 500 });
  }
}
