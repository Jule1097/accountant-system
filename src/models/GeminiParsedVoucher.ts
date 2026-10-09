import { compareCuit, normalizeCuit } from 'src/lib/domain/cuit'
import { normalizeParserText } from 'src/lib/helpers/parser/parser-text'
import { normalizeVoucherCurrency } from 'src/lib/helpers/voucher/voucher-form'
import { resolveGeminiCatalogMatch } from 'src/lib/helpers/parser/gemini-parser'
import { resolveTaxJurisdictionName } from 'src/lib/domain/tax-jurisdictions'
import { isCanonicalDate } from 'src/lib/helpers/platform/canonical-date'
import { voucherCurrencySymbols, voucherOtherTaxesConceptName } from 'src/lib/constants/voucher'
import { Sale } from 'src/models/voucher/Sale'
import { Money } from 'src/models/voucher/Money'
import {
  GeminiParserCatalogs,
  ParsedVoucherData,
  RawGeminiParsedVoucher,
  RawGeminiTaxItem,
  RawGeminiVatDetail,
  VoucherKind,
} from 'src/types/parser/gemini-parser'

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

    const normalizedValue = normalizeParserText(value).trim()

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
      const canonicalDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      return isCanonicalDate(canonicalDate) ? canonicalDate : null
    }

    const latinDateMatch = normalizedValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)

    if (latinDateMatch) {
      const [, day, month, year] = latinDateMatch
      const canonicalDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      return isCanonicalDate(canonicalDate) ? canonicalDate : null
    }
    return null
  }

  private normalizeCurrency(value?: string): "$" | "USD" | null {
    return normalizeVoucherCurrency(value)
  }

  private normalizeExchangeRate(
    currency: "$" | "USD" | null,
    exchangeRate?: number,
  ): number | null {
    if (currency === "$") {
      return 1
    }

    if (currency !== "USD") {
      return null
    }

    if (typeof exchangeRate !== "number" || Number.isNaN(exchangeRate) || exchangeRate <= 0) {
      return null
    }

    return exchangeRate
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
    if (!thirdPartyCuit) return null
    return this.normalizeTextValue(this.extractedData.thirdPartyName)
  }

  private normalizeVoucherLetterValue(value?: string | null, fallbackVoucherType?: string | null): string | null {
    const normalizedValue = this.normalizeTextValue(value)
    const directMatch = normalizedValue?.match(/\b([ABCM])\b/i)

    if (directMatch) {
      return directMatch[1].toUpperCase()
    }

    const normalizedVoucherType = this.normalizeTextValue(fallbackVoucherType)
    const trailingLetterMatch = normalizedVoucherType?.match(/\b([ABCM])$/i)

    if (trailingLetterMatch) {
      return trailingLetterMatch[1].toUpperCase()
    }

    return null
  }

  private resolveVatDetail(detail: RawGeminiVatDetail, catalogs: GeminiParserCatalogs) {
    const matchedVatRate = resolveGeminiCatalogMatch(detail.vatRateName, catalogs.vatRates)

    return {
      vatRateId: matchedVatRate ? matchedVatRate.id : null,
      vatRateName: this.normalizeTextValue(detail.vatRateName),
      subtotal: detail.subtotal ?? null,
      vatAmount: detail.vatAmount ?? null,
    }
  }

  private resolveRetention(retention: RawGeminiTaxItem, catalogs: GeminiParserCatalogs) {
    const matchedRetentionConcept = resolveGeminiCatalogMatch(retention.conceptName, catalogs.retentionConcepts)
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
    const matchedPerceptionConcept = resolveGeminiCatalogMatch(perception.conceptName, catalogs.perceptionConcepts)
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

  private resolvePurchasePerceptions(perceptions: ReturnType<GeminiParsedVoucher["resolvePerception"]>[], catalogs: GeminiParserCatalogs): ReturnType<GeminiParsedVoucher["resolvePerception"]>[] {
    const otherTaxesConcept = catalogs.perceptionConcepts.find((concept) => this.isOtherTaxesConcept(concept.name))
    const knownPerceptions = perceptions.filter((perception) => perception.perceptionConceptId && !this.isOtherTaxesConcept(perception.conceptName))
    const otherTaxesPerceptions = perceptions.filter((perception) => !perception.perceptionConceptId || this.isOtherTaxesConcept(perception.conceptName))
    const genericOtherTaxesAmount = otherTaxesPerceptions.length ? 0 : this.extractedData.otherTaxesAmount || 0
    const otherTaxesAmount = otherTaxesPerceptions.reduce((total, perception) => total + (perception.amount || 0), genericOtherTaxesAmount)

    if (!otherTaxesConcept || otherTaxesAmount <= 0) return knownPerceptions.concat(otherTaxesPerceptions.filter((perception) => perception.perceptionConceptId))

    return [
      ...knownPerceptions,
      {
        perceptionConceptId: otherTaxesConcept.id,
        taxJurisdictionId: null,
        conceptName: voucherOtherTaxesConceptName,
        amount: otherTaxesAmount,
        taxJurisdictionName: null,
      },
    ]
  }

  getLookupThirdPartyCuit(): string | null {
    return this.normalizeThirdPartyCuit(this.extractedData.thirdPartyCuit)
  }

  getLookupThirdPartyName(): string | null {
    return this.normalizeTextValue(this.extractedData.thirdPartyName)
  }

  toResponse(catalogs: GeminiParserCatalogs, thirdPartyId: string | null, voucherKind?: VoucherKind): ParsedVoucherData {
    const thirdPartyCuit = this.getLookupThirdPartyCuit()
    const thirdPartyName = this.normalizeThirdPartyName(thirdPartyCuit)
    const currency = this.normalizeCurrency(this.extractedData.currency)
    const retentions = (this.extractedData.retentions || []).map((retention) => this.resolveRetention(retention, catalogs))
    const perceptions = (this.extractedData.perceptions || []).map((perception) => this.resolvePerception(perception, catalogs))
    const applicableRetentions = voucherKind === "purchase" ? [] : retentions
    const applicablePerceptions = voucherKind === "sale" ? [] : this.resolvePurchasePerceptions(perceptions, catalogs)
    const isPurchase = voucherKind === "purchase"
    const resolvedVoucherLetter = this.normalizeVoucherLetterValue(this.extractedData.voucherLetter, this.extractedData.voucherType)
    const resolvedSubtotal = voucherKind === "sale" && resolvedVoucherLetter === "B" && typeof this.extractedData.taxIncludedAmount === "number" && typeof this.extractedData.vatAmount === "number"
      ? Number(Sale.resolveSubtotalFromTaxIncludedTotal(new Money(this.extractedData.taxIncludedAmount.toString(), currency || voucherCurrencySymbols.ARS), new Money(this.extractedData.vatAmount.toString(), currency || voucherCurrencySymbols.ARS)).toString())
      : this.extractedData.subtotal ?? null

    return {
      posNumber: this.extractedData.posNumber || null,
      number: this.extractedData.number || null,
      date: this.normalizeDate(this.extractedData.date),
      currency,
      exchangeRate: this.normalizeExchangeRate(currency, this.extractedData.exchangeRate),
      subtotal: resolvedSubtotal,
      vatAmount: this.extractedData.vatAmount ?? null,
      nonTaxableAmount: this.extractedData.nonTaxableAmount ?? null,
      exemptAmount: this.extractedData.exemptAmount ?? null,
      otherTaxesAmount: isPurchase ? 0 : this.extractedData.otherTaxesAmount ?? null,
      concept: this.normalizeTextValue(this.extractedData.concept),
      paymentMethod: this.normalizeTextValue(this.extractedData.paymentMethod),
      status: this.normalizeTextValue(this.extractedData.status),
      paymentDate: this.normalizeDate(this.extractedData.paymentDate),
      paidAmount: this.extractedData.paidAmount ?? null,
      comments: this.normalizeTextValue(this.extractedData.comments),
      thirdPartyCuit,
      thirdPartyName,
      voucherType: this.normalizeTextValue(this.extractedData.voucherType),
      voucherLetter: resolvedVoucherLetter,
      vatDetails: (this.extractedData.vatDetails || []).map((detail) => this.resolveVatDetail(detail, catalogs)),
      retentions: applicableRetentions,
      perceptions: applicablePerceptions,
      thirdPartyId,
    }
  }

  private isOtherTaxesConcept(conceptName: string | null): boolean {
    return conceptName?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === "otros impuestos"
  }
}
