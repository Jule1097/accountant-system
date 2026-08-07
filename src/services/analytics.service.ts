import { VoucherRepository } from 'src/repositories/voucher.repository'
import { Voucher } from 'src/models/Voucher'
import { AnalyticsData, PeriodMetrics, TrendEntry } from 'src/types/analytics'

export class AnalyticsService {
  private repository: VoucherRepository

  constructor() {
    this.repository = new VoucherRepository()
  }

  private getCurrencyKey(currency: string): 'ARS' | 'USD' {
    if (currency === '$' || currency === 'ARS') return 'ARS'
    return 'USD'
  }

  private calculatePeriodMetrics(vouchers: Voucher[]): PeriodMetrics {
    const netSales = { ARS: 0, USD: 0 }
    const netPurchases = { ARS: 0, USD: 0 }
    const salesCreditNotes = { ARS: 0, USD: 0 }
    const purchasesCreditNotes = { ARS: 0, USD: 0 }
    const vatDebit = { ARS: 0, USD: 0 }
    const vatCredit = { ARS: 0, USD: 0 }

    const retentionsMap: Record<string, { concept: string; province: string; total: number }> = {}
    const perceptionsMap: Record<string, { concept: string; province: string; total: number }> = {}

    const clientMap: Record<string, { name: string; cuit: string; total: number }> = {}
    const supplierMap: Record<string, { name: string; cuit: string; total: number }> = {}

    for (const v of vouchers) {
      const currency = this.getCurrencyKey(v.currency)
      const subtotal = Number(v.subtotal)
      const totalAmount = Number(v.totalAmount)
      const isCreditNote = v.voucherType?.name === 'Nota de Crédito'

      let retentionSum = 0
      for (const r of v.retentions) {
        const amount = Number(r.amount)
        retentionSum += amount

        const conceptName = r.retentionConcept?.name || 'Otros'
        const provinceName = r.province || 'Nacional'
        const key = `${conceptName}_${provinceName}`

        if (v.type === 'sale') {
          if (!retentionsMap[key]) {
            retentionsMap[key] = { concept: conceptName, province: provinceName, total: 0 }
          }
          retentionsMap[key].total += amount
        } else {
          if (!perceptionsMap[key]) {
            perceptionsMap[key] = { concept: conceptName, province: provinceName, total: 0 }
          }
          perceptionsMap[key].total += amount
        }
      }

      let vatSum = 0
      for (const vd of v.vatDetails) {
        vatSum += Number(vd.vatAmount)
      }

      if (v.type === 'sale') {
        if (isCreditNote) {
          salesCreditNotes[currency] += totalAmount
          vatDebit[currency] -= vatSum
        } else {
          const net = subtotal - retentionSum
          netSales[currency] += net
          vatDebit[currency] += vatSum

          if (v.client) {
            const clientId = v.clientId
            if (clientId) {
              if (!clientMap[clientId]) {
                clientMap[clientId] = { name: v.client.name, cuit: v.client.cuit, total: 0 }
              }
              clientMap[clientId].total += net
            }
          }
        }
      } else {
        if (isCreditNote) {
          purchasesCreditNotes[currency] += totalAmount
          vatCredit[currency] -= vatSum
        } else {
          const net = subtotal - retentionSum
          netPurchases[currency] += net
          vatCredit[currency] += vatSum

          if (v.supplier) {
            const supplierId = v.supplierId
            if (supplierId) {
              if (!supplierMap[supplierId]) {
                supplierMap[supplierId] = { name: v.supplier.name, cuit: v.supplier.cuit, total: 0 }
              }
              supplierMap[supplierId].total += net
            }
          }
        }
      }
    }

    const vatNetBalance = {
      ARS: vatDebit.ARS - vatCredit.ARS,
      USD: vatDebit.USD - vatCredit.USD,
    }

    const retentions = Object.values(retentionsMap)
    const perceptions = Object.values(perceptionsMap)

    const topClients = Object.values(clientMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const topSuppliers = Object.values(supplierMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return {
      netSales,
      netPurchases,
      salesCreditNotes,
      purchasesCreditNotes,
      vatDebit,
      vatCredit,
      vatNetBalance,
      retentions,
      perceptions,
      topClients,
      topSuppliers,
    }
  }

  private calculateMonthlyTrend(vouchers: Voucher[]): { ARS: TrendEntry[]; USD: TrendEntry[] } {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const trend: Record<'ARS' | 'USD', TrendEntry[]> = {
      ARS: [],
      USD: []
    }

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const monthIdx = d.getMonth()
      const label = `${months[monthIdx]} ${year.toString().slice(-2)}`

      const monthVouchers = vouchers.filter((v) => {
        const vd = new Date(v.date)
        return vd.getFullYear() === year && vd.getMonth() === monthIdx
      })

      const trendVouchers = this.calculatePeriodMetrics(monthVouchers)

      trend.ARS.push({
        month: label,
        income: trendVouchers.netSales.ARS,
        expenses: trendVouchers.netPurchases.ARS
      })

      trend.USD.push({
        month: label,
        income: trendVouchers.netSales.USD,
        expenses: trendVouchers.netPurchases.USD
      })
    }

    return trend
  }

  async getAnalytics(companyId: string): Promise<AnalyticsData> {
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    const rawVouchers = await this.repository.findForAnalytics(companyId, oneYearAgo)
    const vouchers = rawVouchers.map(v => new Voucher(v))

    const monthlyCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const semiannualCutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    const monthlyVouchers = vouchers.filter((v) => new Date(v.date) >= monthlyCutoff)
    const semiannualVouchers = vouchers.filter((v) => new Date(v.date) >= semiannualCutoff)
    const annualVouchers = vouchers

    return {
      monthly: this.calculatePeriodMetrics(monthlyVouchers),
      semiannual: this.calculatePeriodMetrics(semiannualVouchers),
      annual: this.calculatePeriodMetrics(annualVouchers),
      trend: this.calculateMonthlyTrend(annualVouchers),
    }
  }
}


