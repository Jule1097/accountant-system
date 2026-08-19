import { Decimal } from 'decimal.js'
import { VoucherPerception, VoucherRetention, VoucherVatDetail } from 'src/types/voucher'

function toValidDate(value: unknown): Date | null {
  if (!value) {
    return null
  }

  const parsedDate = value instanceof Date ? value : new Date(value as string | number)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

function getAccountingPeriodFromDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export class Voucher {
  id?: string
  companyId: string
  type: 'sale' | 'purchase'
  voucherTypeId: string
  voucherLetterId: string
  posNumber: string
  number: string
  clientId?: string | null
  supplierId?: string | null
  date: Date
  accountingPeriod: Date
  currency: string
  exchangeRate: Decimal | number
  subtotal: Decimal | number
  vatAmount: Decimal | number
  nonTaxableAmount: Decimal | number
  exemptAmount: Decimal | number
  otherTaxesAmount: Decimal | number
  totalAmount: Decimal | number
  netAmount: Decimal | number
  concept?: string | null
  paymentMethod: string
  status: 'pending' | 'partial' | 'paid'
  paymentDate?: Date | null
  paidAmount: Decimal | number
  comments?: string | null
  createdByUserId: string
  retentions: VoucherRetention[]
  perceptions: VoucherPerception[]
  vatDetails: VoucherVatDetail[]
  voucherType?: { name: string }
  voucherLetter?: { letter: string }
  client?: { name: string; cuit: string } | null
  supplier?: { name: string; cuit: string } | null

  constructor(data: unknown) {
    const record = data as Record<string, unknown>

    this.id = record.id as string | undefined
    this.companyId = record.companyId as string
    this.type = record.type as 'sale' | 'purchase'
    this.voucherTypeId = record.voucherTypeId as string
    this.voucherLetterId = record.voucherLetterId as string
    this.posNumber = record.posNumber as string
    this.number = record.number as string
    this.clientId = record.clientId as string | null | undefined
    this.supplierId = record.supplierId as string | null | undefined
    this.date = toValidDate(record.date) || new Date()
    this.accountingPeriod = toValidDate(record.accountingPeriod) || getAccountingPeriodFromDate(this.date)
    this.currency = record.currency as string
    this.exchangeRate = record.exchangeRate as Decimal | number
    this.subtotal = record.subtotal as Decimal | number
    this.vatAmount = record.vatAmount as Decimal | number
    this.nonTaxableAmount = (record.nonTaxableAmount as Decimal | number) ?? 0
    this.exemptAmount = (record.exemptAmount as Decimal | number) ?? 0
    this.otherTaxesAmount = (record.otherTaxesAmount as Decimal | number) ?? 0
    this.totalAmount = (record.totalAmount as Decimal | number) ?? 0
    this.netAmount = (record.netAmount as Decimal | number) ?? 0
    this.concept = record.concept as string | null | undefined
    this.paymentMethod = (record.paymentMethod as string) || ''
    this.paymentDate = toValidDate(record.paymentDate)
    this.paidAmount = (record.paidAmount as Decimal | number) || 0
    this.comments = record.comments as string | null | undefined
    this.createdByUserId = (record.createdByUserId as string) || ''
    this.retentions = (record.retentions as VoucherRetention[]) || []
    this.perceptions = (record.perceptions as VoucherPerception[]) || []
    this.vatDetails = (record.vatDetails as VoucherVatDetail[]) || []
    this.voucherType = record.voucherType as { name: string } | undefined
    this.voucherLetter = record.voucherLetter as { letter: string } | undefined
    this.client = record.client as { name: string; cuit: string } | null | undefined
    this.supplier = record.supplier as { name: string; cuit: string } | null | undefined

    if (record.totalAmount === undefined) {
      this.calculateTotalAmount()
    }

    if (record.netAmount === undefined) {
      this.calculateNetAmount()
    }

    this.status = (record.status as 'pending' | 'partial' | 'paid') || this.deriveStatus()
  }

  private sumRetentionAmounts(): Decimal {
    return this.retentions.reduce((sum, retention) => sum.plus(new Decimal(retention.amount.toString())), new Decimal(0))
  }

  private sumPerceptionAmounts(): Decimal {
    return this.perceptions.reduce((sum, perception) => sum.plus(new Decimal(perception.amount.toString())), new Decimal(0))
  }

  isCreditNote(): boolean {
    return this.voucherType?.name === 'Nota de Crédito'
  }

  getBaseAmountForAnalytics(): Decimal {
    return new Decimal(this.subtotal.toString())
      .plus(new Decimal(this.nonTaxableAmount.toString()))
      .plus(new Decimal(this.exemptAmount.toString()))
      .plus(new Decimal(this.otherTaxesAmount.toString()))
  }

  getSignedValue(amount: Decimal | number): Decimal {
    const normalizedAmount = amount instanceof Decimal ? amount : new Decimal(amount.toString())

    if (this.isCreditNote()) {
      return normalizedAmount.negated()
    }

    return normalizedAmount
  }

  calculateTotalAmount(): Decimal {
    const baseAmount = this.getBaseAmountForAnalytics()
    const vatAmount = new Decimal(this.vatAmount.toString())
    const perceptionsAmount = this.type === 'purchase' ? this.sumPerceptionAmounts() : new Decimal(0)
    const totalAmount = baseAmount.plus(vatAmount).plus(perceptionsAmount)

    this.totalAmount = totalAmount
    return totalAmount
  }

  calculateNetAmount(): Decimal {
    const totalAmount = new Decimal(this.totalAmount.toString())

    if (this.type === 'purchase') {
      this.netAmount = totalAmount
      return totalAmount
    }

    const netAmount = totalAmount.minus(this.sumRetentionAmounts())
    this.netAmount = netAmount
    return netAmount
  }

  deriveStatus(): 'pending' | 'partial' | 'paid' {
    const netAmount = new Decimal(this.netAmount.toString())
    const paidAmount = new Decimal(this.paidAmount.toString())

    if (paidAmount.gte(netAmount) && netAmount.gt(0)) {
      this.status = 'paid'
      return this.status
    }

    if (paidAmount.gt(0)) {
      this.status = 'partial'
      return this.status
    }

    this.status = 'pending'
    return this.status
  }

  isDuplicateOf(other: Voucher): boolean {
    return (
      this.companyId === other.companyId &&
      this.type === other.type &&
      (this.type === 'sale' ? this.clientId === other.clientId : this.supplierId === other.supplierId) &&
      this.voucherTypeId === other.voucherTypeId &&
      this.voucherLetterId === other.voucherLetterId &&
      this.posNumber === other.posNumber &&
      this.number === other.number
    )
  }

  recalculate(): void {
    this.calculateTotalAmount()
    this.calculateNetAmount()
    this.deriveStatus()
  }
}
