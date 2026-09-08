import { Money } from "src/models/voucher/Money"
import { Purchase } from "src/models/voucher/Purchase"
import { Sale } from "src/models/voucher/Sale"
import { VoucherFactory } from "src/models/voucher/VoucherFactory"
import { IncompatibleCurrencyError, InvalidVoucherError, UnsupportedVoucherTypeError } from "src/lib/errors/voucher/voucher-errors"
import { VoucherVisitor } from "src/types/voucher/voucher-operations"

const baseVoucherInput = {
  companyId: "company-1",
  voucherTypeId: "voucher-type-1",
  voucherLetterId: "voucher-letter-1",
  posNumber: "00001",
  number: "00000001",
  date: "2026-01-15",
  accountingPeriod: "2026-01-01",
  currency: "ARS",
  exchangeRate: "1.0000",
  subtotal: "100.00",
  vatAmount: "21.00",
  nonTaxableAmount: "0.00",
  exemptAmount: "0.00",
  otherTaxesAmount: "0.00",
  paidAmount: "0.00",
  paymentMethod: "transfer",
  createdByUserId: "user-1",
  retentions: [],
  perceptions: [],
  vatDetails: [],
}

describe("Voucher domain invariants", () => {
  it("creates a Sale only with a client and without perceptions", () => {
    const sale = VoucherFactory.create({
      ...baseVoucherInput,
      type: "sale",
      clientId: "client-1",
      supplierId: null,
      perceptions: [],
    })

    expect(sale).toBeInstanceOf(Sale)
    expect(() => VoucherFactory.create({ ...baseVoucherInput, type: "sale", clientId: null, supplierId: "supplier-1" })).toThrow(InvalidVoucherError)
    expect(() => VoucherFactory.create({ ...baseVoucherInput, type: "sale", clientId: "client-1", perceptions: [{ amount: "1.00" }] })).toThrow(InvalidVoucherError)
  })

  it("creates a Purchase only with a supplier and without retentions", () => {
    const purchase = VoucherFactory.create({
      ...baseVoucherInput,
      type: "purchase",
      clientId: null,
      supplierId: "supplier-1",
      retentions: [],
    })

    expect(purchase).toBeInstanceOf(Purchase)
    expect(() => VoucherFactory.create({ ...baseVoucherInput, type: "purchase", clientId: "client-1", supplierId: null })).toThrow(InvalidVoucherError)
    expect(() => VoucherFactory.create({ ...baseVoucherInput, type: "purchase", clientId: null, supplierId: "supplier-1", retentions: [{ amount: "1.00" }] })).toThrow(InvalidVoucherError)
  })

  it("keeps type-specific properties in their concrete voucher classes", () => {
    const sale = VoucherFactory.create({ ...baseVoucherInput, type: "sale", clientId: "client-1", supplierId: null, retentions: [{ amount: "10.00" }], perceptions: [] })
    const purchase = VoucherFactory.create({ ...baseVoucherInput, type: "purchase", clientId: null, supplierId: "supplier-1", retentions: [], perceptions: [{ amount: "10.00" }] })

    expect(sale).toHaveProperty("clientId", "client-1")
    expect(sale).toHaveProperty("retentions", [expect.objectContaining({ amount: "10.00" })])
    expect(sale).not.toHaveProperty("supplierId")
    expect(sale).not.toHaveProperty("perceptions")
    expect(purchase).toHaveProperty("supplierId", "supplier-1")
    expect(purchase).toHaveProperty("perceptions", [expect.objectContaining({ amount: "10.00" })])
    expect(purchase).not.toHaveProperty("clientId")
    expect(purchase).not.toHaveProperty("retentions")
  })

  it("dispatches voucher operations through polymorphic contracts", () => {
    const sale = VoucherFactory.create({ ...baseVoucherInput, type: "sale", clientId: "client-1", supplierId: null })
    const purchase = VoucherFactory.create({ ...baseVoucherInput, type: "purchase", clientId: null, supplierId: "supplier-1" })
    const visitor: VoucherVisitor<string> = {
      visitSale: (voucher) => `sale:${voucher.clientId}`,
      visitPurchase: (voucher) => `purchase:${voucher.supplierId}`,
    }

    expect(sale.accept(visitor)).toBe("sale:client-1")
    expect(purchase.accept(visitor)).toBe("purchase:supplier-1")
    expect(sale.getPersistenceData()).toMatchObject({ clientId: "client-1", supplierId: null, perceptions: [] })
    expect(purchase.getPersistenceData()).toMatchObject({ clientId: null, supplierId: "supplier-1", retentions: [] })
  })

  it("preserves the creator identity in the domain voucher", () => {
    const voucher = VoucherFactory.create({ ...baseVoucherInput, type: "sale", clientId: "client-1", supplierId: null })

    expect(voucher.createdByUserId).toBe("user-1")
  })

  it("rejects unsupported voucher types with a typed error", () => {
    expect(() => VoucherFactory.create({ ...baseVoucherInput, type: "credit" })).toThrow(UnsupportedVoucherTypeError)
  })

  it("rejects arithmetic between incompatible currencies", () => {
    expect(() => new Money("10.00", "ARS").add(new Money("1.00", "USD"))).toThrow(IncompatibleCurrencyError)
  })

  it("rehydrates legacy nullable values without discarding persisted data", () => {
    const voucher = VoucherFactory.rehydrate({
      ...baseVoucherInput,
      type: "purchase",
      clientId: null,
      supplierId: "supplier-1",
      exchangeRate: null,
      nonTaxableAmount: null,
      exemptAmount: null,
      otherTaxesAmount: null,
      paidAmount: null,
      totalAmount: null,
      netAmount: null,
      status: "paid",
    })

    expect(voucher).toBeInstanceOf(Purchase)
    expect(voucher.status).toBe("paid")
    expect(voucher.exchangeRate.toString()).toBe("1.0000")
    expect(voucher.totalAmount.toString()).toBe("121.00")
  })

  it("rejects incomplete data during strict creation", () => {
    expect(() => VoucherFactory.create({ ...baseVoucherInput, type: "sale", companyId: "", clientId: "client-1", supplierId: null })).toThrow(InvalidVoucherError)
    expect(() => VoucherFactory.create({ ...baseVoucherInput, type: "sale", date: "invalid-date", clientId: "client-1", supplierId: null })).toThrow(InvalidVoucherError)
    expect(() => VoucherFactory.create({ ...baseVoucherInput, type: "sale", currency: "", clientId: "client-1", supplierId: null })).toThrow(InvalidVoucherError)
  })

  it("preserves persisted calculated values during historical rehydration", () => {
    const voucher = VoucherFactory.rehydrate({ ...baseVoucherInput, type: "purchase", clientId: null, supplierId: "supplier-1", totalAmount: "999.99", netAmount: "888.88", paidAmount: "10.00", status: "partial" })

    expect(voucher.totalAmount.toString()).toBe("999.99")
    expect(voucher.netAmount.toString()).toBe("888.88")
    expect(voucher.status).toBe("partial")
  })

  it("keeps accounting and relation metadata in the domain", () => {
    const voucher = VoucherFactory.create({ ...baseVoucherInput, type: "purchase", clientId: null, supplierId: "supplier-1", voucherTypeName: "Factura", voucherLetter: "A", supplier: { name: "Proveedor", cuit: "30111111119" }, accountingPeriod: "2026-01-01" })

    expect(voucher.accountingPeriod).toBe("2026-01-01")
    expect(voucher.voucherTypeName).toBe("Factura")
    expect(voucher.voucherLetter).toBe("A")
    expect(voucher).toHaveProperty("supplier.cuit", "30111111119")
  })

  it("uses the domain credit-note category for signed values and exchange conversion", () => {
    const voucher = VoucherFactory.create({ ...baseVoucherInput, type: "sale", clientId: "client-1", supplierId: null, voucherTypeCategory: "credit_note", exchangeRate: "1.2500" })

    expect(voucher.isCreditNote()).toBe(true)
    expect(voucher.getSignedValue(new Money("100.00", "ARS")).toString()).toBe("-100.00")
    expect(voucher.getSignedValueInArs(new Money("100.00", "ARS")).toString()).toBe("-125.00")
  })
})
