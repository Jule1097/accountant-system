import { VoucherRepository } from 'src/repositories/voucher/voucher.repository'
import { voucherZeroAmount } from 'src/lib/constants/voucher'
import { Money } from 'src/models/voucher/Money'
import { Sale } from 'src/models/voucher/Sale'
import { Voucher } from 'src/models/voucher/Voucher'
import { AnalyticsData, PeriodMetrics, TrendEntry } from 'src/types/analytics/analytics'
import type { VoucherVisitor } from 'src/types/voucher/voucher-operations'

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
    signedAmount: Money
  ): void {
    const key = `${concept}_${province}_${currency}`

    if (!taxMap[key]) {
      taxMap[key] = { concept, province, currency, total: 0 }
    }

    taxMap[key].total += Number(signedAmount.toString())
  }

  private calculateRetentionTotal(voucher: Sale): Money {
    return voucher.retentions.reduce((sum, retention) => sum.add(new Money(retention.amount.toString(), voucher.currency)), new Money(voucherZeroAmount, voucher.currency))
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

    const visitor: VoucherVisitor<void> = {
      visitSale: (voucher) => {
        const currency = this.getCurrencyKey(voucher.currency)
        const baseAmount = voucher.getBaseAmountForAnalytics()
        const signedBaseAmount = voucher.getSignedValue(baseAmount)
        const signedVatAmount = voucher.getSignedValue(voucher.vatAmount)
        const signedTotalAmount = voucher.getSignedValue(voucher.totalAmount)
        const signedRetentionTotal = voucher.getSignedValue(this.calculateRetentionTotal(voucher))
        netSales[currency] += Number(signedBaseAmount.subtract(signedRetentionTotal).toString())
        vatDebit[currency] += Number(signedVatAmount.toString())

        for (const retention of voucher.retentions) {
          const concept = retention.conceptName || 'Otros'
          const province = retention.taxJurisdictionName || 'Nacional'
          this.updateTaxMap(retentionsMap, concept, province, currency, voucher.getSignedValue(new Money(retention.amount.toString(), voucher.currency)))
        }

        if (voucher.isCreditNote()) {
          salesCreditNotes[currency] += Math.abs(Number(signedTotalAmount.toString()))
        }

        if (voucher.client && voucher.clientId) {
          if (!clientMap[voucher.clientId]) {
            clientMap[voucher.clientId] = { name: voucher.client.name, cuit: voucher.client.cuit, total: 0 }
          }

          clientMap[voucher.clientId].total += Number(signedBaseAmount.toString())
        }
      },
      visitPurchase: (voucher) => {
        const currency = this.getCurrencyKey(voucher.currency)
        const baseAmount = voucher.getBaseAmountForAnalytics()
        const signedBaseAmount = voucher.getSignedValue(baseAmount)
        const signedVatAmount = voucher.getSignedValue(voucher.vatAmount)
        const signedTotalAmount = voucher.getSignedValue(voucher.totalAmount)
        netPurchases[currency] += Number(signedBaseAmount.toString())
        vatCredit[currency] += Number(signedVatAmount.toString())

        for (const perception of voucher.perceptions) {
          const concept = perception.conceptName || 'Otros'
          const province = perception.taxJurisdictionName || 'Nacional'
          this.updateTaxMap(perceptionsMap, concept, province, currency, voucher.getSignedValue(new Money(perception.amount.toString(), voucher.currency)))
        }

        if (voucher.isCreditNote()) {
          purchasesCreditNotes[currency] += Math.abs(Number(signedTotalAmount.toString()))
        }

        if (voucher.supplier && voucher.supplierId) {
          if (!supplierMap[voucher.supplierId]) {
            supplierMap[voucher.supplierId] = { name: voucher.supplier.name, cuit: voucher.supplier.cuit, total: 0 }
          }

          supplierMap[voucher.supplierId].total += Number(signedBaseAmount.toString())
        }
      },
    }

    vouchers.forEach((voucher) => voucher.accept(visitor))

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
    const vouchers = rawVouchers
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
