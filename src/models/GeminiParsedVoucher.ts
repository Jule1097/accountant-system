import { compareCuit, normalizeCuit } from 'src/lib/cuit'
import { resolveTaxJurisdictionName } from 'src/lib/tax-jurisdictions'
import {
  GeminiParserCatalogs,
  GeminiParserResponse,
  RawGeminiParsedVoucher,
  RawGeminiTaxItem,
  RawGeminiVatDetail,
} from 'src/types/gemini-parser'

export class GeminiParsedVoucher {
  private readonly extractedData: RawGeminiParsedVoucher
  private readonly activeCompanyCuit?: string

  constructor(extractedData: RawGeminiParsedVoucher, activeCompanyCuit?: string) {
    this.extractedData = extractedData
    this.activeCompanyCuit = activeCompanyCuit
  }

  private normalizeTextValue(value?: string | null): string | null {
    if (!value) {
      return null
    }

    const normalizedValue = value.trim()

    if (!normalizedValue) {
      return null
    }

    if (normalizedValue.toLowerCase() === 'null') {
      return null
    }

    return normalizedValue
  }

  private normalizeDate(value?: string): string | null {
    if (!value) {
      return null
    }

    const normalizedValue = value.trim()
    const isoMatch = normalizedValue.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)

    if (isoMatch) {
      const [, year, month, day] = isoMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const latinDateMatch = normalizedValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)

    if (latinDateMatch) {
      const [, day, month, year] = latinDateMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const parsedDate = new Date(normalizedValue)

    if (isNaN(parsedDate.getTime())) {
      return null
    }

    return parsedDate.toISOString().split('T')[0]
  }

  private normalizeThirdPartyCuit(value?: string): string | null {
    if (!value) {
      return null
    }

    const normalizedCuit = normalizeCuit(value)

    if (!this.activeCompanyCuit) {
      return normalizedCuit
    }

    if (compareCuit(normalizedCuit, this.activeCompanyCuit)) {
      return null
    }

    return normalizedCuit
  }

  private normalizeThirdPartyName(thirdPartyCuit: string | null): string | null {
    if (!thirdPartyCuit) {
      return null
    }

    return this.normalizeTextValue(this.extractedData.thirdPartyName)
  }

  private resolveVatDetail(detail: RawGeminiVatDetail, catalogs: GeminiParserCatalogs) {
    const matchedVatRate = catalogs.vatRates.find(
      (vatRate) => vatRate.name.toLowerCase() === detail.vatRateName?.toLowerCase()
    )

    return {
      vatRateId: matchedVatRate ? matchedVatRate.id : null,
      vatRateName: this.normalizeTextValue(detail.vatRateName),
      subtotal: detail.subtotal ?? null,
      vatAmount: detail.vatAmount ?? null,
    }
  }

  private resolveRetention(retention: RawGeminiTaxItem, catalogs: GeminiParserCatalogs) {
    const matchedRetentionConcept = catalogs.retentionConcepts.find(
      (concept) => concept.name.toLowerCase() === retention.conceptName?.toLowerCase()
    )
    const jurisdictionName = resolveTaxJurisdictionName(retention.province)
    const matchedTaxJurisdiction = jurisdictionName
      ? catalogs.taxJurisdictions.find((jurisdiction) => jurisdiction.name === jurisdictionName)
      : null

    return {
      retentionConceptId: matchedRetentionConcept ? matchedRetentionConcept.id : null,
      taxJurisdictionId: matchedTaxJurisdiction ? matchedTaxJurisdiction.id : null,
      conceptName: this.normalizeTextValue(retention.conceptName),
      amount: retention.amount ?? null,
      taxJurisdictionName: matchedTaxJurisdiction ? matchedTaxJurisdiction.name : jurisdictionName,
    }
  }

  private resolvePerception(perception: RawGeminiTaxItem, catalogs: GeminiParserCatalogs) {
    const matchedPerceptionConcept = catalogs.perceptionConcepts.find(
      (concept) => concept.name.toLowerCase() === perception.conceptName?.toLowerCase()
    )
    const jurisdictionName = resolveTaxJurisdictionName(perception.province)
    const matchedTaxJurisdiction = jurisdictionName
      ? catalogs.taxJurisdictions.find((jurisdiction) => jurisdiction.name === jurisdictionName)
      : null

    return {
      perceptionConceptId: matchedPerceptionConcept ? matchedPerceptionConcept.id : null,
      taxJurisdictionId: matchedTaxJurisdiction ? matchedTaxJurisdiction.id : null,
      conceptName: this.normalizeTextValue(perception.conceptName),
      amount: perception.amount ?? null,
      taxJurisdictionName: matchedTaxJurisdiction ? matchedTaxJurisdiction.name : jurisdictionName,
    }
  }

  getLookupThirdPartyCuit(): string | null {
    return this.normalizeThirdPartyCuit(this.extractedData.thirdPartyCuit)
  }

  toResponse(catalogs: GeminiParserCatalogs, thirdPartyId: string | null): GeminiParserResponse {
    const thirdPartyCuit = this.getLookupThirdPartyCuit()
    const thirdPartyName = this.normalizeThirdPartyName(thirdPartyCuit)

    return {
      posNumber: this.extractedData.posNumber || null,
      number: this.extractedData.number || null,
      date: this.normalizeDate(this.extractedData.date),
      currency: this.extractedData.currency || null,
      subtotal: this.extractedData.subtotal ?? null,
      vatAmount: this.extractedData.vatAmount ?? null,
      nonTaxableAmount: this.extractedData.nonTaxableAmount ?? null,
      exemptAmount: this.extractedData.exemptAmount ?? null,
      otherTaxesAmount: this.extractedData.otherTaxesAmount ?? null,
      totalAmount: this.extractedData.totalAmount ?? null,
      concept: this.normalizeTextValue(this.extractedData.concept),
      paymentMethod: this.normalizeTextValue(this.extractedData.paymentMethod),
      status: this.normalizeTextValue(this.extractedData.status),
      paymentDate: this.normalizeDate(this.extractedData.paymentDate),
      paidAmount: this.extractedData.paidAmount ?? null,
      comments: this.normalizeTextValue(this.extractedData.comments),
      thirdPartyCuit,
      thirdPartyName,
      voucherType: this.normalizeTextValue(this.extractedData.voucherType),
      voucherLetter: this.normalizeTextValue(this.extractedData.voucherLetter),
      vatDetails: (this.extractedData.vatDetails || []).map((detail) => this.resolveVatDetail(detail, catalogs)),
      retentions: (this.extractedData.retentions || []).map((retention) => this.resolveRetention(retention, catalogs)),
      perceptions: (this.extractedData.perceptions || []).map((perception) => this.resolvePerception(perception, catalogs)),
      thirdPartyId,
    }
  }
}
