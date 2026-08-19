export type VoucherKind = 'sale' | 'purchase'

export interface RawGeminiVatDetail {
  vatRateName?: string
  subtotal?: number
  vatAmount?: number
}

export interface RawGeminiTaxItem {
  conceptName?: string
  amount?: number
  province?: string
}

export interface RawGeminiParsedVoucher {
  posNumber?: string
  number?: string
  date?: string
  currency?: string
  exchangeRate?: number
  subtotal?: number
  vatAmount?: number
  nonTaxableAmount?: number
  exemptAmount?: number
  otherTaxesAmount?: number
  totalAmount?: number
  concept?: string
  paymentMethod?: string
  status?: string
  paymentDate?: string
  paidAmount?: number
  comments?: string
  thirdPartyCuit?: string
  thirdPartyName?: string
  voucherType?: string
  voucherLetter?: string
  vatDetails?: RawGeminiVatDetail[]
  retentions?: RawGeminiTaxItem[]
  perceptions?: RawGeminiTaxItem[]
}

export type GeminiRepairableField =
  | "thirdPartyName"
  | "concept"
  | "paymentMethod"
  | "status"
  | "comments"
  | "voucherType"
  | "voucherLetter"
  | "vatDetails"
  | "retentions"
  | "perceptions"

export interface GeminiParserCatalogVatRate {
  id: string
  name: string
}

export interface GeminiParserCatalogRetentionConcept {
  id: string
  name: string
}

export interface GeminiParserCatalogPerceptionConcept {
  id: string
  name: string
}

export interface GeminiParserCatalogTaxJurisdiction {
  id: string
  name: string
}

export interface GeminiParserCatalogs {
  vatRates: GeminiParserCatalogVatRate[]
  retentionConcepts: GeminiParserCatalogRetentionConcept[]
  perceptionConcepts: GeminiParserCatalogPerceptionConcept[]
  taxJurisdictions: GeminiParserCatalogTaxJurisdiction[]
}

export interface GeminiParserResolvedVatDetail {
  vatRateId: string | null
  vatRateName: string | null
  subtotal: number | null
  vatAmount: number | null
}

export interface GeminiParserResolvedRetention {
  retentionConceptId: string | null
  taxJurisdictionId: string | null
  conceptName: string | null
  amount: number | null
  taxJurisdictionName: string | null
}

export interface GeminiParserResolvedPerception {
  perceptionConceptId: string | null
  taxJurisdictionId: string | null
  conceptName: string | null
  amount: number | null
  taxJurisdictionName: string | null
}

export interface GeminiParserResponse {
  posNumber: string | null
  number: string | null
  date: string | null
  currency: string | null
  exchangeRate: number | null
  subtotal: number | null
  vatAmount: number | null
  nonTaxableAmount: number | null
  exemptAmount: number | null
  otherTaxesAmount: number | null
  totalAmount: number | null
  concept: string | null
  paymentMethod: string | null
  status: string | null
  paymentDate: string | null
  paidAmount: number | null
  comments: string | null
  thirdPartyCuit: string | null
  thirdPartyName: string | null
  voucherType: string | null
  voucherLetter: string | null
  vatDetails: GeminiParserResolvedVatDetail[]
  retentions: GeminiParserResolvedRetention[]
  perceptions: GeminiParserResolvedPerception[]
  thirdPartyId: string | null
}

export interface GeminiParseOptions {
  activeCompanyCuit?: string
  voucherKind?: VoucherKind | null
}
