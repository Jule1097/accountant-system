export interface AnalyticsDataPoint {
  month: string
  income: number
  expenses: number
}

export interface ExpenseCategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface ComparisonPeriodData {
  month: string
  income: number
  expenses: number
  margin: number
  status: 'up' | 'down' | 'stable'
}

export interface TaxBreakdownEntry {
  concept: string
  province: string
  currency: 'ARS' | 'USD'
  total: number
}

export interface TopPartyEntry {
  name: string
  cuit: string
  total: number
}

export interface CurrencyValue {
  ARS: number
  USD: number
}

export interface PeriodMetrics {
  netSales: CurrencyValue
  netPurchases: CurrencyValue
  salesCreditNotes: CurrencyValue
  purchasesCreditNotes: CurrencyValue
  vatDebit: CurrencyValue
  vatCredit: CurrencyValue
  vatNetBalance: CurrencyValue
  retentions: TaxBreakdownEntry[]
  perceptions: TaxBreakdownEntry[]
  topClients: TopPartyEntry[]
  topSuppliers: TopPartyEntry[]
}

export interface TrendEntry {
  month: string
  income: number
  expenses: number
}

export interface AnalyticsData {
  monthly: PeriodMetrics
  semiannual: PeriodMetrics
  annual: PeriodMetrics
  trend: {
    ARS: TrendEntry[]
    USD: TrendEntry[]
  }
}

export interface UseAnalyticsResult {
  promise: Promise<AnalyticsData> | null
}
