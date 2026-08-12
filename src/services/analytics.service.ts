import { Decimal } from 'decimal.js'
import { VoucherRepository } from 'src/repositories/voucher.repository'
import { Voucher } from 'src/models/Voucher'
import { AnalyticsData, PeriodMetrics, TrendEntry } from 'src/types/analytics'

export class AnalyticsService {
  private repository: VoucherRepository

  constructor() {
    this.repository = new VoucherRepository()
  }

  private getCurrencyKey(currency: string): 'ARS' | 'USD' {
    if (currency === '$' || currency === 'ARS') {
      return 'ARS'
    }

    return 'USD'
  }

  private updateTaxMap(
    taxMap: Record<string, { concept: string; province: string; currency: 'ARS' | 'USD'; total: number }>,
    concept: string,
    province: string,
    currency: 'ARS' | 'USD',
    signedAmount: Decimal
  ): void {
    const key = `${concept}_${province}_${currency}`

    if (!taxMap[key]) {
      taxMap[key] = { concept, province, currency, total: 0 }
    }

    taxMap[key].total += signedAmount.toNumber()
  }

  private calculateRetentionTotal(voucher: Voucher): Decimal {
    return voucher.retentions.reduce((sum, retention) => sum.plus(new Decimal(retention.amount.toString())), new Decimal(0))
  }

  private calculatePerceptionTotal(voucher: Voucher): Decimal {
    return voucher.perceptions.reduce((sum, perception) => sum.plus(new Decimal(perception.amount.toString())), new Decimal(0))
  }

  private calculatePeriodMetrics(vouchers: Voucher[]): PeriodMetrics {
    const netSales = { ARS: 0, USD: 0 }
    const netPurchases = { ARS: 0, USD: 0 }
    const salesCreditNotes = { ARS: 0, USD: 0 }
    const purchasesCreditNotes = { ARS: 0, USD: 0 }
    const vatDebit = { ARS: 0, USD: 0 }
    const vatCredit = { ARS: 0, USD: 0 }
    const retentionsMap: Record<string, { concept: string; province: string; currency: 'ARS' | 'USD'; total: number }> = {}
    const perceptionsMap: Record<string, { concept: string; province: string; currency: 'ARS' | 'USD'; total: number }> = {}
    const clientMap: Record<string, { name: string; cuit: string; total: number }> = {}
    const supplierMap: Record<string, { name: string; cuit: string; total: number }> = {}

    for (const voucher of vouchers) {
      const currency = this.getCurrencyKey(voucher.currency)
      const baseAmount = voucher.getBaseAmountForAnalytics()
      const signedBaseAmount = voucher.getSignedValue(baseAmount)
      const signedVatAmount = voucher.getSignedValue(voucher.vatAmount)
      const signedTotalAmount = voucher.getSignedValue(voucher.totalAmount)

      if (voucher.type === 'sale') {
        const signedRetentionTotal = voucher.getSignedValue(this.calculateRetentionTotal(voucher))
        netSales[currency] += signedBaseAmount.minus(signedRetentionTotal).toNumber()
        vatDebit[currency] += signedVatAmount.toNumber()

        for (const retention of voucher.retentions) {
          const concept = retention.retentionConcept?.name || 'Otros'
          const province = retention.taxJurisdiction?.name || 'Nacional'
          this.updateTaxMap(retentionsMap, concept, province, currency, voucher.getSignedValue(retention.amount))
        }

        if (voucher.isCreditNote()) {
          salesCreditNotes[currency] += Math.abs(signedTotalAmount.toNumber())
        }

        if (voucher.client && voucher.clientId) {
          if (!clientMap[voucher.clientId]) {
            clientMap[voucher.clientId] = { name: voucher.client.name, cuit: voucher.client.cuit, total: 0 }
          }

          clientMap[voucher.clientId].total += signedBaseAmount.toNumber()
        }

        continue
      }

      netPurchases[currency] += signedBaseAmount.toNumber()
      vatCredit[currency] += signedVatAmount.toNumber()

      for (const perception of voucher.perceptions) {
        const concept = perception.perceptionConcept?.name || 'Otros'
        const province = perception.taxJurisdiction?.name || 'Nacional'
        this.updateTaxMap(perceptionsMap, concept, province, currency, voucher.getSignedValue(perception.amount))
      }

      if (voucher.isCreditNote()) {
        purchasesCreditNotes[currency] += Math.abs(signedTotalAmount.toNumber())
      }

      if (voucher.supplier && voucher.supplierId) {
        if (!supplierMap[voucher.supplierId]) {
          supplierMap[voucher.supplierId] = { name: voucher.supplier.name, cuit: voucher.supplier.cuit, total: 0 }
        }

        supplierMap[voucher.supplierId].total += signedBaseAmount.toNumber()
      }
    }

    return {
      netSales,
      netPurchases,
      salesCreditNotes,
      purchasesCreditNotes,
      vatDebit,
      vatCredit,
      vatNetBalance: {
        ARS: vatDebit.ARS - vatCredit.ARS,
        USD: vatDebit.USD - vatCredit.USD,
      },
      retentions: Object.values(retentionsMap),
      perceptions: Object.values(perceptionsMap),
      topClients: Object.values(clientMap).sort((left, right) => right.total - left.total).slice(0, 5),
      topSuppliers: Object.values(supplierMap).sort((left, right) => right.total - left.total).slice(0, 5),
    }
  }

  private calculateMonthlyTrend(vouchers: Voucher[]): { ARS: TrendEntry[]; USD: TrendEntry[] } {
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const trend: Record<'ARS' | 'USD', TrendEntry[]> = {
      ARS: [],
      USD: [],
    }
    const now = new Date()

    for (let monthOffset = 11; monthOffset >= 0; monthOffset -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
      const year = monthDate.getFullYear()
      const monthIndex = monthDate.getMonth()
      const monthLabel = `${monthLabels[monthIndex]} ${year.toString().slice(-2)}`
      const monthVouchers = vouchers.filter((voucher) => {
        const voucherDate = new Date(voucher.date)
        return voucherDate.getFullYear() === year && voucherDate.getMonth() === monthIndex
      })
      const metrics = this.calculatePeriodMetrics(monthVouchers)
      const monthlyPerceptions = metrics.perceptions.reduce(
        (totals, perception) => {
          totals[perception.currency] += perception.total
          return totals
        },
        { ARS: 0, USD: 0 }
      )

      trend.ARS.push({
        month: monthLabel,
        income: metrics.netSales.ARS,
        expenses: metrics.netPurchases.ARS + metrics.vatCredit.ARS + monthlyPerceptions.ARS,
      })

      trend.USD.push({
        month: monthLabel,
        income: metrics.netSales.USD,
        expenses: metrics.netPurchases.USD + metrics.vatCredit.USD + monthlyPerceptions.USD,
      })
    }

    return trend
  }

  async getAnalytics(companyId: string): Promise<AnalyticsData> {
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const rawVouchers = await this.repository.findForAnalytics(companyId, oneYearAgo)
    const vouchers = rawVouchers.map((voucher) => new Voucher(voucher))
    const monthlyCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const semiannualCutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    return {
      monthly: this.calculatePeriodMetrics(vouchers.filter((voucher) => new Date(voucher.date) >= monthlyCutoff)),
      semiannual: this.calculatePeriodMetrics(vouchers.filter((voucher) => new Date(voucher.date) >= semiannualCutoff)),
      annual: this.calculatePeriodMetrics(vouchers),
      trend: this.calculateMonthlyTrend(vouchers),
    }
  }
}
