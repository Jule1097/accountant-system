import { NextRequest, NextResponse } from "next/server"
import { DashboardService } from "src/services/dashboard/Dashboard"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyId = request.headers.get("x-company-id")

    if (!companyId) {
      return NextResponse.json({ error: "Falta la empresa activa" }, { status: 400 })
    }

    const dashboardService = new DashboardService()
    const recentActivity = await dashboardService.getRecentActivity(companyId)

    return NextResponse.json(recentActivity)
  } catch (error: unknown) {
    console.error("Error fetching dashboard recent activity:", error)
    return NextResponse.json({ error: "No se pudo cargar la actividad del dashboard" }, { status: 500 })
  }
}
