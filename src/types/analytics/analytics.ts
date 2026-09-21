export type CurrencyAmounts = Record<string, number>
export type CurrencyNullableAmounts = Record<string, number | null>

export interface AnalyticsPeriodSelection {
  start: Date
  end: Date
  now: Date
}

export interface AnalyticsVariation {
  absolute: number
  percentage: number | null
}

export interface AnalyticsChartEntry {
  month: string
  cobros: number
  pagos: number
  balance: number
  margin: number | null
  variation: AnalyticsVariation
}

export interface AnalyticsSummaryCardsProps {
  currency: string
  periodLabel?: string
  collections: number
  payments: number
  balance: number
  margin: number | null
  collectionsVariation: AnalyticsVariation
  paymentsVariation: AnalyticsVariation
  balanceVariation: AnalyticsVariation
}

export interface AnalyticsHeaderProps {
  currency?: string
  availableCurrencies?: string[]
  showControls?: boolean
  onCurrencyChange?: (currency: string) => void
}

export interface AnalyticsCashMetrics {
  collections: CurrencyAmounts
  payments: CurrencyAmounts
  balance: CurrencyAmounts
  margin: CurrencyNullableAmounts
}

export interface AnalyticsDocumentMetrics {
  sales: CurrencyAmounts
  purchases: CurrencyAmounts
}

export interface AnalyticsPendingMetrics {
  count: number
  amount: CurrencyAmounts
}

export interface AnalyticsTaxTotal {
  concept: string
  currency: string
  total: number
}

export interface AnalyticsTaxTotals {
  retentions: AnalyticsTaxTotal[]
  perceptions: AnalyticsTaxTotal[]
}

export interface PurchaseDistributionEntry {
  id: string
  amount: number
  percentage: number
}

export interface TopPartyEntry {
  name: string
  cuit: string
  total: number
  currency: string
}

export interface AnalyticsPeriodMetrics extends AnalyticsCashMetrics, AnalyticsDocumentMetrics {
  pending: AnalyticsPendingMetrics
  purchaseDistribution: Record<string, PurchaseDistributionEntry[]>
  salesByClient: Record<string, ClientSalesEntry[]>
  taxes: AnalyticsTaxTotals
  topClients: TopPartyEntry[]
  topSuppliers: TopPartyEntry[]
}

export interface ClientSalesEntry {
  clientId: string
  name: string
  total: number
  currency: string
}

export interface AnalyticsTrendEntry {
  month: string
  monthIndex: number
  cobros: CurrencyAmounts
  pagos: CurrencyAmounts
  balance: CurrencyAmounts
  margin: CurrencyNullableAmounts
  variation: Record<string, AnalyticsVariation>
  paymentsVariation: Record<string, AnalyticsVariation>
  balanceVariation: Record<string, AnalyticsVariation>
}

export interface AnalyticsData {
  currentMonth: AnalyticsPeriodMetrics
  annual: AnalyticsPeriodMetrics
  annualVariations: {
    collections: Record<string, AnalyticsVariation>
    payments: Record<string, AnalyticsVariation>
    balance: Record<string, AnalyticsVariation>
  }
  trend: AnalyticsTrendEntry[]
}

export interface ExpenseCategoryData extends PurchaseDistributionEntry {
  category: string
  color: string
}

export type AnalyticsDataPoint = AnalyticsTrendEntry
export type TrendEntry = AnalyticsTrendEntry
export type TaxBreakdownEntry = AnalyticsTaxTotal
export type CurrencyValue = CurrencyAmounts
export type PeriodMetrics = AnalyticsPeriodMetrics

export interface UseAnalyticsResult {
  promise: Promise<AnalyticsData> | null
}
