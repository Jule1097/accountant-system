
export type ExportMode = 'filters' | 'declaration'
export type ExportType = 'sales' | 'purchases'

export interface ExportQueryParams {
  mode: ExportMode
  type: ExportType
  search?: string | null
  status?: 'pending' | 'partial' | 'paid' | null
  dateFrom?: Date
  dateTo?: Date
  sortBy?: 'date' | 'status' | 'voucher'
  sortOrder?: 'asc' | 'desc'
}

export interface VoucherExportResult {
  filename: string
  buffer: Buffer
}

export interface ExportColumnDefinition {
  header: string
  key: string
  isDate?: boolean
  isMonetary?: boolean
  isRate?: boolean
  isCenter?: boolean
  isText?: boolean
}

export interface RetentionConceptLike {
  id: string
  name: string
  type: string
}

export interface PerceptionConceptLike {
  id: string
  name: string
}

export interface VatRateLike {
  id: string
  name: string
  rate: { toNumber(): number }
}
