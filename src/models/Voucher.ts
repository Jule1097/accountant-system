import { Prisma } from 'src/generated/prisma/client'
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
  exchangeRate: Prisma.Decimal | number
  subtotal: Prisma.Decimal | number
  vatAmount: Prisma.Decimal | number
  totalAmount: Prisma.Decimal | number
  netAmount: Prisma.Decimal | number
  concept?: string | null
  paymentMethod: string
  status: 'pending' | 'partial' | 'paid'
  paymentDate?: Date | null
  paidAmount: Prisma.Decimal | number
  comments?: string | null
  createdByUserId: string

  retentions: VoucherRetention[]
  vatDetails: VoucherVatDetail[]

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
    this.exchangeRate = d.exchangeRate as Prisma.Decimal | number
    this.subtotal = d.subtotal as Prisma.Decimal | number
    this.vatAmount = d.vatAmount as Prisma.Decimal | number
    this.totalAmount = d.totalAmount as Prisma.Decimal | number
    this.concept = d.concept as string | null | undefined
    this.paymentMethod = d.paymentMethod as string
    this.paymentDate = d.paymentDate ? (d.paymentDate instanceof Date ? d.paymentDate : new Date(d.paymentDate as string | number)) : null
    this.paidAmount = (d.paidAmount as Prisma.Decimal | number) || 0
    this.comments = d.comments as string | null | undefined
    this.createdByUserId = d.createdByUserId as string
    this.retentions = (d.retentions as VoucherRetention[]) || []
    this.vatDetails = (d.vatDetails as VoucherVatDetail[]) || []

    this.netAmount = d.netAmount !== undefined ? (d.netAmount as Prisma.Decimal | number) : this.calculateNetAmount()
    this.status = (d.status as 'pending' | 'partial' | 'paid') || this.deriveStatus()
  }

  calculateNetAmount(): Prisma.Decimal {
    const total = new Prisma.Decimal(this.totalAmount.toString())
    const retentionSum = this.retentions.reduce(
      (sum, r) => sum.plus(new Prisma.Decimal(r.amount.toString())),
      new Prisma.Decimal(0)
    )
    
    const net = total.minus(retentionSum)
    this.netAmount = net
    return net
  }

  deriveStatus(): 'pending' | 'partial' | 'paid' {
    const net = new Prisma.Decimal(this.netAmount.toString())
    const paid = new Prisma.Decimal(this.paidAmount.toString())

    if (paid.gte(net) && net.gt(0)) {
      this.status = 'paid'
    } else if (paid.gt(0)) {
      this.status = 'partial'
    } else {
      this.status = 'pending'
    }
    
    return this.status
  }

  // Business logic to check for duplicates
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

  // Recalculate derived fields
  recalculate() {
    this.calculateNetAmount()
    this.deriveStatus()
  }
}
