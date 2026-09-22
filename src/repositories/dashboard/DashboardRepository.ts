import prisma from "src/lib/database/prisma"
import type { Prisma } from "src/generated/prisma/client"
import type { DashboardRecentActivityData, DashboardRecentPurchaseEntry, DashboardWeeklySalesEntry } from "src/types/dashboard/dashboard"

interface DashboardRecentSaleRawRecord {
  date: Date
  totalAmount: Prisma.Decimal
}

interface DashboardRecentPurchaseRawRecord {
  id: string
  date: Date
  totalAmount: Prisma.Decimal
  supplier: { name: string } | null
  voucherType: { name: string } | null
}

const dashboardWeeks = ["Semana 1", "Semana 2", "Semana 3", "Semana 4", "Semana 5"] as const
const dashboardActivityDays = 35
const dashboardWeekCount = 5
const dashboardDaysPerWeek = 7

function buildWeeklySales(sales: DashboardRecentSaleRawRecord[], now: Date): DashboardWeeklySalesEntry[] {
  const cutoff = new Date(now.getTime() - dashboardActivityDays * 24 * 60 * 60 * 1000)
  const weeklySales = dashboardWeeks.map((week) => ({ week, amount: 0 }))
  sales.forEach((sale) => {
    const daysAgo = Math.floor((now.getTime() - sale.date.getTime()) / (24 * 60 * 60 * 1000))
    const weekIndex = Math.min(Math.max(Math.floor(daysAgo / dashboardDaysPerWeek), 0), dashboardWeekCount - 1)
    if (sale.date >= cutoff) weeklySales[weekIndex].amount += Number(sale.totalAmount)
  })
  return weeklySales
}

function mapRecentPurchases(purchases: DashboardRecentPurchaseRawRecord[]): DashboardRecentPurchaseEntry[] {
  return purchases.map((purchase) => ({
    id: purchase.id,
    supplierName: purchase.supplier?.name || null,
    date: purchase.date.toISOString(),
    voucherTypeName: purchase.voucherType?.name || null,
    totalAmount: Number(purchase.totalAmount),
  }))
}

export class DashboardRepository {
  async findRecentActivity(companyId: string): Promise<DashboardRecentActivityData> {
    const now = new Date()
    const salesCutoff = new Date(now.getTime() - dashboardActivityDays * 24 * 60 * 60 * 1000)
    const sales = await prisma.voucher.findMany({
      where: { companyId, type: "sale", date: { gte: salesCutoff } },
      select: { date: true, totalAmount: true },
      orderBy: { date: "desc" },
    })
    const purchases = await prisma.voucher.findMany({
      where: { companyId, type: "purchase" },
      select: { id: true, date: true, totalAmount: true, supplier: { select: { name: true } }, voucherType: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 3,
    })

    return {
      weeklySales: buildWeeklySales(sales as DashboardRecentSaleRawRecord[], now),
      recentPurchases: mapRecentPurchases(purchases as DashboardRecentPurchaseRawRecord[]),
    }
  }
}
