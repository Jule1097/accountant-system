import { analyticsCurrencyAliases, analyticsDefaultCurrency, analyticsFallbackTaxConcept, analyticsMonthNames, analyticsPurchaseCategoryIds } from "src/lib/constants/analytics"
import { voucherCurrencySymbols, voucherDocumentIdentificationModes, voucherStatusValues, voucherTypeValues } from "src/lib/constants/voucher"
import { Money } from "src/models/voucher/Money"
import type { Voucher } from "src/models/voucher/Voucher"
import type { AnalyticsCashMetrics, AnalyticsDocumentMetrics, AnalyticsPeriodMetrics, AnalyticsPeriodSelection, AnalyticsTaxTotal, AnalyticsTaxTotals, AnalyticsTrendEntry, ClientSalesEntry, CurrencyAmounts, PurchaseDistributionEntry, TopPartyEntry } from "src/types/analytics/analytics"
import type { VoucherRecordType, VoucherSummaryResponse } from "src/types/voucher/voucher"

export function getAnalyticsCurrencyKey(currency: string): string {
  if (currency === voucherCurrencySymbols.ARS) return analyticsDefaultCurrency
  if (currency === analyticsCurrencyAliases.pesos) return analyticsDefaultCurrency
  return currency
}

function addAmount(amounts: CurrencyAmounts, currency: string, amount: number): void {
  amounts[currency] = (amounts[currency] ?? 0) + amount
}

function getSignedNumber(voucher: Voucher, amount: Money): number {
  return Number(voucher.getSignedValue(amount).toString())
}

function calculateMargin(collections: CurrencyAmounts, payments: CurrencyAmounts): Record<string, number | null> {
  const currencies = new Set([...Object.keys(collections), ...Object.keys(payments)])
  return Object.fromEntries([...currencies].map((currency) => {
    const collection = collections[currency] ?? 0
    const payment = payments[currency] ?? 0
    return [currency, collection > 0 ? Number((((collection - payment) / collection) * 100).toFixed(2)) : null]
  }))
}

function calculateBalance(collections: CurrencyAmounts, payments: CurrencyAmounts): CurrencyAmounts {
  const currencies = new Set([...Object.keys(collections), ...Object.keys(payments)])
  return Object.fromEntries([...currencies].map((currency) => [currency, (collections[currency] ?? 0) - (payments[currency] ?? 0)]))
}

function isWithinPeriod(date: Date, period: AnalyticsPeriodSelection): boolean {
  return date >= period.start && date < period.end && date <= period.now
}

function addTaxTotal(totals: AnalyticsTaxTotal[], concept: string, currency: string, amount: number): void {
  const existing = totals.find((item) => item.concept === concept && item.currency === currency)
  if (existing) {
    existing.total += amount
    return
  }
  totals.push({ concept, currency, total: amount })
}

function calculatePurchaseComponentTotal(voucher: Voucher): number {
  return voucher.accept({
    visitSale: () => 0,
    visitPurchase: (purchase) => {
      const perceptionTotal = purchase.perceptions.reduce((sum, perception) => sum + Number(perception.amount), 0)
      const total = Number(purchase.subtotal.toString()) + Number(purchase.vatAmount.toString()) + Number(purchase.nonTaxableAmount.toString()) + Number(purchase.exemptAmount.toString()) + Number(purchase.otherTaxesAmount.toString()) + perceptionTotal
      return Number(purchase.getSignedValue(new Money(total.toString(), purchase.currency)).toString())
    },
  })
}

function filterByAccountingPeriod(vouchers: Voucher[], period: AnalyticsPeriodSelection): Voucher[] {
  return vouchers.filter((voucher) => {
    const accountingPeriod = new Date(voucher.accountingPeriod)
    return accountingPeriod >= period.start && accountingPeriod < period.end
  })
}

function calculateTopParties(vouchers: Voucher[], period: AnalyticsPeriodSelection, type: string): TopPartyEntry[] {
  const entries: TopPartyEntry[] = []
  vouchers.filter((voucher) => voucher.type === type && isWithinPeriod(getEffectiveCashDate(voucher), period)).forEach((voucher) => {
    const party = voucher.getParty()
    if (!party) return
    const currency = getAnalyticsCurrencyKey(voucher.currency)
    const amount = getSignedNumber(voucher, voucher.paidAmount)
    const existing = entries.find((item) => item.name === party.name && item.cuit === (party.cuit || "") && item.currency === currency)
    if (existing) {
      existing.total += amount
      return
    }
    entries.push({ name: party.name, cuit: party.cuit || "", total: amount, currency })
  })
  return entries.sort((left, right) => right.total - left.total).slice(0, 5)
}

export function getEffectiveCashDate(voucher: Voucher): Date {
  return new Date(voucher.paymentDate ?? voucher.accountingPeriod)
}

export function calculateSalesByClient(vouchers: Voucher[], period: AnalyticsPeriodSelection): Record<string, ClientSalesEntry[]> {
  const clients = new Map<string, ClientSalesEntry>()
  vouchers.filter((voucher) => voucher.type === voucherTypeValues.sale && isWithinPeriod(getEffectiveCashDate(voucher), period)).forEach((voucher) => {
    const party = voucher.getParty()
    if (!party) return
    const clientId = voucher.getPartyId()
    if (!clientId || !party.name) return
    const currency = getAnalyticsCurrencyKey(voucher.currency)
    const key = `${currency}:${clientId}`
    const amount = getSignedNumber(voucher, voucher.paidAmount)
    const existing = clients.get(key)
    if (existing) {
      existing.total += amount
      return
    }
    clients.set(key, { clientId, name: party.name, total: amount, currency })
  })
  return Object.fromEntries([...new Set([...clients.values()].map((client) => client.currency))].map((currency) => [currency, [...clients.values()].filter((client) => client.currency === currency).sort((left, right) => right.total - left.total)]))
}

export function calculateCashMetrics(vouchers: Voucher[], period: AnalyticsPeriodSelection): AnalyticsCashMetrics {
  const collections: CurrencyAmounts = {}
  const payments: CurrencyAmounts = {}

  vouchers.forEach((voucher) => {
    if (!isWithinPeriod(getEffectiveCashDate(voucher), period)) return
    const currency = getAnalyticsCurrencyKey(voucher.currency)
    const amount = getSignedNumber(voucher, voucher.paidAmount)
    if (voucher.type === voucherTypeValues.sale) addAmount(collections, currency, amount)
    if (voucher.type === voucherTypeValues.purchase) addAmount(payments, currency, amount)
  })

  return { collections, payments, balance: calculateBalance(collections, payments), margin: calculateMargin(collections, payments) }
}

export function calculateDocumentMetrics(vouchers: Voucher[]): AnalyticsDocumentMetrics {
  const sales: CurrencyAmounts = {}
  const purchases: CurrencyAmounts = {}

  vouchers.forEach((voucher) => {
    const currency = getAnalyticsCurrencyKey(voucher.currency)
    const amount = voucher.type === voucherTypeValues.sale ? getSignedNumber(voucher, voucher.netAmount) : calculatePurchaseComponentTotal(voucher)
    if (voucher.type === voucherTypeValues.sale) addAmount(sales, currency, amount)
    if (voucher.type === voucherTypeValues.purchase) addAmount(purchases, currency, amount)
  })

  return { sales, purchases }
}

function isPendingVoucher(voucher: Voucher): boolean {
  return voucher.status === voucherStatusValues.pending || voucher.status === voucherStatusValues.partial
}

export function calculatePendingCount(vouchers: Voucher[]): number {
  return vouchers.filter(isPendingVoucher).length
}

export function calculatePendingMetrics(vouchers: Voucher[]): { count: number; amount: CurrencyAmounts } {
  const amount: CurrencyAmounts = {}
  const pendingVouchers = vouchers.filter(isPendingVoucher)

  pendingVouchers.forEach((voucher) => {
    addAmount(amount, getAnalyticsCurrencyKey(voucher.currency), getSignedNumber(voucher, voucher.netAmount.subtract(voucher.paidAmount)))
  })

  return { count: pendingVouchers.length, amount }
}

function calculateSummaryCash(vouchers: Voucher[], now: Date): { collections: CurrencyAmounts; payments: CurrencyAmounts } {
  const collections: CurrencyAmounts = {}
  const payments: CurrencyAmounts = {}
  vouchers.forEach((voucher) => {
    if (getEffectiveCashDate(voucher) > now) return
    const currency = getAnalyticsCurrencyKey(voucher.currency)
    const amount = getSignedNumber(voucher, voucher.paidAmount)
    if (voucher.type === voucherTypeValues.sale) addAmount(collections, currency, amount)
    if (voucher.type === voucherTypeValues.purchase) addAmount(payments, currency, amount)
  })
  return { collections, payments }
}

export function calculatePurchaseDistribution(vouchers: Voucher[], currency?: string): PurchaseDistributionEntry[] {
  const totals = new Map<string, number>([
    [analyticsPurchaseCategoryIds.fiscal, 0],
    [analyticsPurchaseCategoryIds.nonFiscal, 0],
  ])

  vouchers.filter((voucher) => voucher.type === voucherTypeValues.purchase && (!currency || getAnalyticsCurrencyKey(voucher.currency) === currency)).forEach((voucher) => {
    const category = voucher.documentIdentificationMode === voucherDocumentIdentificationModes.nonFiscal ? analyticsPurchaseCategoryIds.nonFiscal : analyticsPurchaseCategoryIds.fiscal
    totals.set(category, (totals.get(category) ?? 0) + calculatePurchaseComponentTotal(voucher))
  })

  const entries = [...totals.entries()].filter(([, amount]) => amount !== 0).sort((left, right) => right[1] - left[1])
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0)
  return entries.map(([id, amount]) => ({ id, amount, percentage: total > 0 ? Math.round((amount / total) * 100) : 0 }))
}

export function calculateTaxTotals(vouchers: Voucher[]): AnalyticsTaxTotals {
  const retentions: AnalyticsTaxTotal[] = []
  const perceptions: AnalyticsTaxTotal[] = []

  vouchers.forEach((voucher) => {
    const currency = getAnalyticsCurrencyKey(voucher.currency)
    voucher.accept({
      visitSale: (sale) => sale.retentions.forEach((retention) => addTaxTotal(retentions, retention.conceptName || analyticsFallbackTaxConcept, currency, getSignedNumber(sale, new Money(retention.amount.toString(), sale.currency)))),
      visitPurchase: (purchase) => purchase.perceptions.forEach((perception) => addTaxTotal(perceptions, perception.conceptName || analyticsFallbackTaxConcept, currency, getSignedNumber(purchase, new Money(perception.amount.toString(), purchase.currency)))),
    })
  })

  return { retentions, perceptions }
}

export function calculateVoucherSummary(vouchers: Voucher[], type: VoucherRecordType, now = new Date()): VoucherSummaryResponse {
  const filteredVouchers = vouchers.filter((voucher) => voucher.type === type)
  const documentTotals = calculateDocumentMetrics(filteredVouchers)
  const cashTotals = calculateSummaryCash(filteredVouchers, now)
  const pendingCount = calculatePendingCount(filteredVouchers)
  const partyTotals = new Map<string, { currency: string; name: string; total: number }>()
  const topParty: Record<string, { name: string; total: number }> = {}

  filteredVouchers.forEach((voucher) => {
    const party = voucher.getParty()
    if (!party) return
    const currency = getAnalyticsCurrencyKey(voucher.currency)
    const key = `${currency}:${party.name}:${party.cuit || ""}`
    const total = getSignedNumber(voucher, voucher.paidAmount)
    const current = partyTotals.get(key)
    if (current) current.total += total
    if (!current) partyTotals.set(key, { currency, name: party.name, total })
  })

  partyTotals.forEach((party) => {
    const current = topParty[party.currency]
    if (!current || party.total > current.total) topParty[party.currency] = { name: party.name, total: party.total }
  })

  const nonFiscalAmount: CurrencyAmounts = {}
  filteredVouchers.filter((voucher) => voucher.type === voucherTypeValues.purchase && voucher.documentIdentificationMode === voucherDocumentIdentificationModes.nonFiscal).forEach((voucher) => addAmount(nonFiscalAmount, getAnalyticsCurrencyKey(voucher.currency), calculatePurchaseComponentTotal(voucher)))

  return {
    totalCount: filteredVouchers.length,
    documentTotal: type === voucherTypeValues.sale ? documentTotals.sales : documentTotals.purchases,
    cashTotal: type === voucherTypeValues.sale ? cashTotals.collections : cashTotals.payments,
    topParty,
    pendingCount,
    nonFiscalAmount,
  }
}

export function calculateMonthlyVariation(current: number, previous: number): { absolute: number; percentage: number | null } {
  const absolute = current - previous
  return { absolute, percentage: previous === 0 ? null : Number(((absolute / previous) * 100).toFixed(2)) }
}

function calculateCurrencyVariations(current: CurrencyAmounts, previous: CurrencyAmounts): Record<string, { absolute: number; percentage: number | null }> {
  const currencies = new Set([...Object.keys(current), ...Object.keys(previous)])
  return Object.fromEntries([...currencies].map((currency) => [currency, calculateMonthlyVariation(current[currency] ?? 0, previous[currency] ?? 0)]))
}

export function calculateCashVariations(current: AnalyticsCashMetrics, previous: AnalyticsCashMetrics): { collections: Record<string, { absolute: number; percentage: number | null }>; payments: Record<string, { absolute: number; percentage: number | null }>; balance: Record<string, { absolute: number; percentage: number | null }> } {
  return { collections: calculateCurrencyVariations(current.collections, previous.collections), payments: calculateCurrencyVariations(current.payments, previous.payments), balance: calculateCurrencyVariations(current.balance, previous.balance) }
}

function createMonthPeriod(year: number, monthIndex: number, now: Date): AnalyticsPeriodSelection {
  return { start: new Date(Date.UTC(year, monthIndex, 1)), end: new Date(Date.UTC(year, monthIndex + 1, 1)), now }
}

function getPreviousMonthPeriod(year: number, monthIndex: number, now: Date): AnalyticsPeriodSelection {
  return monthIndex === 0 ? createMonthPeriod(year - 1, 11, now) : createMonthPeriod(year, monthIndex - 1, now)
}

function getCurrencyValues(metrics: AnalyticsCashMetrics, property: "collections" | "payments"): CurrencyAmounts {
  return metrics[property]
}

export function buildAnnualTrend(vouchers: Voucher[], year: number, now: Date): AnalyticsTrendEntry[] {
  return analyticsMonthNames.map((month, monthIndex) => {
    const currentMetrics = calculateCashMetrics(vouchers, createMonthPeriod(year, monthIndex, now))
    const previousMetrics = calculateCashMetrics(vouchers, getPreviousMonthPeriod(year, monthIndex, now))
    const currencies = new Set([...Object.keys(currentMetrics.collections), ...Object.keys(currentMetrics.payments), ...Object.keys(previousMetrics.collections), ...Object.keys(previousMetrics.payments)])
    const variation = Object.fromEntries([...currencies].map((currency) => [currency, calculateMonthlyVariation(currentMetrics.collections[currency] ?? 0, previousMetrics.collections[currency] ?? 0)]))
    const paymentsVariation = Object.fromEntries([...currencies].map((currency) => [currency, calculateMonthlyVariation(currentMetrics.payments[currency] ?? 0, previousMetrics.payments[currency] ?? 0)]))
    const balanceVariation = Object.fromEntries([...currencies].map((currency) => [currency, calculateMonthlyVariation(currentMetrics.balance[currency] ?? 0, previousMetrics.balance[currency] ?? 0)]))
    return {
      month,
      monthIndex,
      cobros: getCurrencyValues(currentMetrics, "collections"),
      pagos: getCurrencyValues(currentMetrics, "payments"),
      balance: currentMetrics.balance,
      margin: currentMetrics.margin,
      variation,
      paymentsVariation,
      balanceVariation,
    }
  })
}

export function calculatePeriodMetrics(vouchers: Voucher[], accountingPeriod: AnalyticsPeriodSelection, cashPeriod: AnalyticsPeriodSelection): AnalyticsPeriodMetrics {
  const documentVouchers = filterByAccountingPeriod(vouchers, accountingPeriod)
  const cash = calculateCashMetrics(vouchers, cashPeriod)
  const documents = calculateDocumentMetrics(documentVouchers)
  const currencies = new Set(documentVouchers.map((voucher) => getAnalyticsCurrencyKey(voucher.currency)))
  const purchaseDistribution = Object.fromEntries([...currencies].map((currency) => [currency, calculatePurchaseDistribution(documentVouchers, currency)]))
  const salesByClient = calculateSalesByClient(vouchers, cashPeriod)
  return {
    ...cash,
    ...documents,
    pending: calculatePendingMetrics(documentVouchers),
    purchaseDistribution,
    salesByClient,
    taxes: calculateTaxTotals(documentVouchers),
    topClients: calculateTopParties(vouchers, cashPeriod, voucherTypeValues.sale),
    topSuppliers: calculateTopParties(vouchers, cashPeriod, voucherTypeValues.purchase),
  }
}
