import { Decimal } from 'decimal.js'
import { VoucherRetention, VoucherVatDetail } from 'src/types/voucher'

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
  vatDetails: VoucherVatDetail[]

  voucherType?: { name: string }
  voucherLetter?: { letter: string }
  client?: { name: string; cuit: string } | null
  supplier?: { name: string; cuit: string } | null

  constructor(data: unknown) {
    const d = data as Record<string, unknown>
    this.id = d.id as string | undefined
    this.companyId = d.companyId as string
    this.type = d.type as 'sale' | 'purchase'
    this.voucherTypeId = d.voucherTypeId as string
    this.voucherLetterId = d.voucherLetterId as string
    this.posNumber = d.posNumber as string
    this.number = d.number as string
    this.clientId = d.clientId as string | null | undefined
    this.supplierId = d.supplierId as string | null | undefined
    this.date = d.date instanceof Date ? d.date : new Date(d.date as string | number)
    this.accountingPeriod = d.accountingPeriod instanceof Date ? d.accountingPeriod : new Date(d.accountingPeriod as string | number)
    this.currency = d.currency as string
    this.exchangeRate = d.exchangeRate as Decimal | number
    this.subtotal = d.subtotal as Decimal | number
    this.vatAmount = d.vatAmount as Decimal | number
    this.totalAmount = d.totalAmount as Decimal | number
    this.concept = d.concept as string | null | undefined
    this.paymentMethod = d.paymentMethod as string
    this.paymentDate = d.paymentDate ? (d.paymentDate instanceof Date ? d.paymentDate : new Date(d.paymentDate as string | number)) : null
    this.paidAmount = (d.paidAmount as Decimal | number) || 0
    this.comments = d.comments as string | null | undefined
    this.createdByUserId = d.createdByUserId as string
    this.retentions = (d.retentions as VoucherRetention[]) || []
    this.vatDetails = (d.vatDetails as VoucherVatDetail[]) || []

    this.voucherType = d.voucherType as { name: string } | undefined
    this.voucherLetter = d.voucherLetter as { letter: string } | undefined
    this.client = d.client as { name: string; cuit: string } | null | undefined
    this.supplier = d.supplier as { name: string; cuit: string } | null | undefined

    this.netAmount = d.netAmount !== undefined ? (d.netAmount as Decimal | number) : this.calculateNetAmount()
    this.status = (d.status as 'pending' | 'partial' | 'paid') || this.deriveStatus()
  }

  calculateNetAmount(): Decimal {
    const total = new Decimal(this.totalAmount.toString())
    const retentionSum = this.retentions.reduce(
      (sum, r) => sum.plus(new Decimal(r.amount.toString())),
      new Decimal(0)
    )

    const net = total.minus(retentionSum)
    this.netAmount = net
    return net
  }

  deriveStatus(): 'pending' | 'partial' | 'paid' {
    const net = new Decimal(this.netAmount.toString())
    const paid = new Decimal(this.paidAmount.toString())

    if (paid.gte(net) && net.gt(0)) {
      this.status = 'paid'
    } else if (paid.gt(0)) {
      this.status = 'partial'
    } else {
      this.status = 'pending'
    }

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

  recalculate() {
    this.calculateNetAmount()
    this.deriveStatus()
  }
}
