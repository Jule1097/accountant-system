import { Money } from "src/models/voucher/Money"
import { Sale } from "src/models/voucher/Sale"
import { VoucherFactory } from "src/models/voucher/VoucherFactory"
import type { Voucher } from "src/models/voucher/Voucher"
import type { VoucherFactoryInput } from "src/types/voucher/domain"

const baseVoucherInput: VoucherFactoryInput = {
  id: "voucher-1",
  companyId: "company-1",
  type: "sale",
  voucherTypeId: "voucher-type-1",
  voucherTypeCategory: "standard",
  voucherTypeName: "Factura",
  voucherLetterId: "voucher-letter-1",
  voucherLetter: "A",
  posNumber: "00001",
  number: "00000001",
  clientId: "client-1",
  supplierId: null,
  date: "2026-01-15",
  accountingPeriod: "2026-01-01",
  currency: "ARS",
  exchangeRate: "1.0000",
  subtotal: "100.00",
  vatAmount: "21.00",
  nonTaxableAmount: "0.00",
  exemptAmount: "0.00",
  otherTaxesAmount: "0.00",
  paymentMethod: "transfer",
  paidAmount: "0.00",
  concept: null,
  paymentDate: null,
  comments: null,
  createdByUserId: "user-1",
  retentions: [{ retentionConceptId: "retention-1", amount: "10.00" }],
  perceptions: [],
  vatDetails: [],
}

function buildVoucher(overrides: Partial<VoucherFactoryInput> = {}): Voucher {
  return VoucherFactory.create({
    ...baseVoucherInput,
    ...overrides,
  })
}

describe("Voucher domain calculations", () => {
  it("calculates the net subtotal from a sales total that includes VAT", () => {
    const subtotal = Sale.resolveSubtotalFromTaxIncludedTotal(new Money("121.00", "ARS"), new Money("21.00", "ARS"))

    expect(subtotal.toString()).toBe("100.00")
  })

  it("calculates sales totals and net amount with retentions", () => {
    const voucher = buildVoucher()

    expect(voucher.calculateTotalAmount().toString()).toBe("121.00")
    expect(voucher.calculateNetAmount().toString()).toBe("111.00")
  })

  it("calculates purchase totals with perceptions and keeps net amount equal to total", () => {
    const voucher = buildVoucher({
      type: "purchase",
      clientId: null,
      supplierId: "supplier-1",
      retentions: [],
      perceptions: [{ perceptionConceptId: "perception-1", amount: "5.00" }],
    })

    expect(voucher.calculateTotalAmount().toString()).toBe("126.00")
    expect(voucher.calculateNetAmount().toString()).toBe("126.00")
  })

  it("preserves an explicitly paid status when no payment amount was recorded", () => {
    const voucher = buildVoucher({ status: "paid", paidAmount: "0.00" })

    voucher.recalculate()

    expect(voucher.status).toBe("paid")
  })

  it("rounds monetary results to two decimal places", () => {
    const voucher = buildVoucher({ subtotal: "1.005", vatAmount: "0.00", retentions: [] })

    expect(voucher.calculateTotalAmount().toString()).toBe("1.01")
  })

  it("detects duplicates only when company, type, party and numbering match", () => {
    const voucher = buildVoucher()
    const duplicate = buildVoucher()
    const differentParty = buildVoucher({ clientId: "client-2" })

    expect(voucher.isDuplicateOf(duplicate)).toBe(true)
    expect(voucher.isDuplicateOf(differentParty)).toBe(false)
  })

  it("applies credit-note sign and exchange-rate conversion", () => {
    const voucher = buildVoucher({ exchangeRate: "1.25" })

    expect(voucher.getSignedValue(new Money("100.00", "ARS")).toString()).toBe("100.00")
    expect(voucher.getSignedValueInArs(new Money("100.00", "ARS")).toString()).toBe("125.00")
  })

  it("recalculates total, net amount, balance and derived status together", () => {
    const voucher = buildVoucher({ paidAmount: "111.00" })

    voucher.recalculate()

    expect(voucher.totalAmount.toString()).toBe("121.00")
    expect(voucher.netAmount.toString()).toBe("111.00")
    expect(voucher.saldo.toString()).toBe("0.00")
    expect(voucher.status).toBe("paid")
  })
})
