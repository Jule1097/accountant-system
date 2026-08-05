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
