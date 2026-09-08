import { normalizeOptionalMoneyAmount } from "src/lib/helpers/voucher/money"
import { voucherCurrencyCodes, voucherDefaultAccountingPeriodDay, voucherDefaultExchangeRate, voucherNegativeMultiplier, voucherStatusValues, voucherTypeCategories } from "src/lib/constants/voucher"
import { ExchangeRate } from "src/models/voucher/ExchangeRate"
import { Money } from "src/models/voucher/Money"
import { VoucherDomainInput, VoucherDomainStatus, VoucherSnapshot, VoucherTypeCategory, VoucherVatDetailInput } from "src/types/voucher/domain"
import type { VoucherPersistenceData, VoucherParty, VoucherVisitor } from "src/types/voucher/voucher-operations"

export abstract class Voucher {
  readonly id?: string
  readonly companyId: string
  readonly type: string
  readonly voucherTypeId: string
  readonly voucherTypeCategory: VoucherTypeCategory
  readonly voucherTypeName: string | null
  readonly voucherLetterId: string
  readonly voucherLetter: string | null
  readonly posNumber: string
  readonly number: string
  readonly date: string
  readonly accountingPeriod: string
  readonly currency: string
  readonly exchangeRate: ExchangeRate
  readonly subtotal: Money
  readonly vatAmount: Money
  readonly nonTaxableAmount: Money
  readonly exemptAmount: Money
  readonly otherTaxesAmount: Money
  readonly paidAmount: Money
  readonly paymentMethod: string | null
  readonly paymentDate: string | null
  readonly concept: string | null
  readonly comments: string | null
  readonly createdByUserId: string
  readonly vatDetails: readonly VoucherVatDetailInput[]
  totalAmount: Money
  netAmount: Money
  saldo: Money
  status: VoucherDomainStatus
  private readonly hasExplicitStatus: boolean
  private readonly hasPersistedTotal: boolean
  private readonly hasPersistedNet: boolean
  private readonly hasPersistedSaldo: boolean

  protected constructor(input: VoucherDomainInput) {
    this.id = input.id
    this.companyId = input.companyId
    this.type = input.type
    this.voucherTypeId = input.voucherTypeId
    this.voucherTypeCategory = input.voucherTypeCategory ?? voucherTypeCategories.standard
    this.voucherTypeName = input.voucherTypeName ?? null
    this.voucherLetterId = input.voucherLetterId
    this.voucherLetter = input.voucherLetter ?? null
    this.posNumber = input.posNumber
    this.number = input.number
    this.date = input.date
    this.accountingPeriod = input.accountingPeriod ?? `${input.date.slice(0, 7)}-${voucherDefaultAccountingPeriodDay}`
    this.currency = input.currency
    this.exchangeRate = new ExchangeRate(input.exchangeRate ?? voucherDefaultExchangeRate)
    this.subtotal = new Money(input.subtotal.toString(), this.currency)
    this.vatAmount = new Money(input.vatAmount.toString(), this.currency)
    this.nonTaxableAmount = new Money(normalizeOptionalMoneyAmount(input.nonTaxableAmount), this.currency)
    this.exemptAmount = new Money(normalizeOptionalMoneyAmount(input.exemptAmount), this.currency)
    this.otherTaxesAmount = new Money(normalizeOptionalMoneyAmount(input.otherTaxesAmount), this.currency)
    this.paidAmount = new Money(normalizeOptionalMoneyAmount(input.paidAmount), this.currency)
    this.paymentMethod = input.paymentMethod ?? null
    this.paymentDate = input.paymentDate ?? null
    this.concept = input.concept ?? null
    this.comments = input.comments ?? null
    this.createdByUserId = input.createdByUserId
    this.vatDetails = input.vatDetails
    this.totalAmount = new Money(normalizeOptionalMoneyAmount(input.totalAmount), this.currency)
    this.netAmount = new Money(normalizeOptionalMoneyAmount(input.netAmount), this.currency)
    this.saldo = new Money(normalizeOptionalMoneyAmount(input.saldo), this.currency)
    this.hasExplicitStatus = input.status !== null && input.status !== undefined
    this.hasPersistedTotal = input.totalAmount !== null && input.totalAmount !== undefined
    this.hasPersistedNet = input.netAmount !== null && input.netAmount !== undefined
    this.hasPersistedSaldo = input.saldo !== null && input.saldo !== undefined
    this.status = input.status ?? voucherStatusValues.pending
  }

  protected baseTotal(): Money {
    return this.subtotal.add(this.vatAmount).add(this.nonTaxableAmount).add(this.exemptAmount).add(this.otherTaxesAmount)
  }

  abstract calculateTotalAmount(): Money
  abstract calculateNetAmount(): Money
  abstract accept<TResult>(visitor: VoucherVisitor<TResult>): TResult
  abstract getParty(): VoucherParty
  abstract getPersistenceData(): VoucherPersistenceData

  protected rehydrate(): void {
    if (!this.hasPersistedTotal) this.calculateTotalAmount()
    if (!this.hasPersistedNet) this.calculateNetAmount()
    if (!this.hasPersistedSaldo) this.calculateSaldo()
    this.deriveStatus()
  }

  calculateSaldo(): Money {
    this.saldo = this.netAmount.subtract(this.paidAmount)
    return this.saldo
  }

  deriveStatus(): VoucherDomainStatus {
    if (this.hasExplicitStatus) return this.status
    const paidAmount = Number(this.paidAmount.toString())
    const netAmount = Number(this.netAmount.toString())
    this.status = paidAmount >= netAmount && netAmount > 0 ? voucherStatusValues.paid : paidAmount > 0 ? voucherStatusValues.partial : voucherStatusValues.pending
    return this.status
  }

  recalculate(): void {
    this.calculateTotalAmount()
    this.calculateNetAmount()
    this.deriveStatus()
    this.calculateSaldo()
  }

  abstract getPartyId(): string | null

  isDuplicateOf(other: Voucher): boolean {
    return this.companyId === other.companyId && this.type === other.type && this.getPartyId() === other.getPartyId() && this.voucherTypeId === other.voucherTypeId && this.voucherLetterId === other.voucherLetterId && this.posNumber === other.posNumber && this.number === other.number
  }

  isCreditNote(): boolean {
    return this.voucherTypeCategory === voucherTypeCategories.creditNote
  }

  getBaseAmountForAnalytics(): Money {
    return this.subtotal.add(this.nonTaxableAmount).add(this.exemptAmount).add(this.otherTaxesAmount)
  }

  getSignedValue(amount: Money): Money {
    return this.isCreditNote() ? amount.multiply(voucherNegativeMultiplier) : amount
  }

  getSignedValueInArs(amount: Money): Money {
    const convertedAmount = new Money(amount.multiply(this.exchangeRate.toString()).toString(), voucherCurrencyCodes.ars)
    return this.getSignedValue(convertedAmount)
  }

  toSnapshot(): VoucherSnapshot {
    return { id: this.id, companyId: this.companyId, type: this.type, voucherTypeId: this.voucherTypeId, voucherLetterId: this.voucherLetterId, posNumber: this.posNumber, number: this.number, date: this.date, accountingPeriod: this.accountingPeriod, currency: this.currency, exchangeRate: this.exchangeRate.toString(), subtotal: this.subtotal.toString(), vatAmount: this.vatAmount.toString(), nonTaxableAmount: this.nonTaxableAmount.toString(), exemptAmount: this.exemptAmount.toString(), otherTaxesAmount: this.otherTaxesAmount.toString(), totalAmount: this.totalAmount.toString(), netAmount: this.netAmount.toString(), saldo: this.saldo.toString(), paidAmount: this.paidAmount.toString(), paymentMethod: this.paymentMethod, paymentDate: this.paymentDate, status: this.status, concept: this.concept, comments: this.comments, createdByUserId: this.createdByUserId }
  }
}
