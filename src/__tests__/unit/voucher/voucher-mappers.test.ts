import { Decimal } from "decimal.js"
import { mapPrismaVoucherToDomainInput, mapVoucherToPrismaData } from "src/lib/helpers/voucher/voucher-persistence"
import { serializeVoucher } from "src/lib/helpers/voucher/voucher-serialization"
import { VoucherFactory } from "src/models/voucher/VoucherFactory"

const prismaVoucherRecord = {
  id: "voucher-1",
  companyId: "company-1",
  type: "purchase",
  voucherTypeId: "voucher-type-1",
  voucherLetterId: "voucher-letter-1",
  posNumber: "00001",
  number: "00000001",
  clientId: null,
  supplierId: "supplier-1",
  date: new Date("2026-01-15T00:00:00.000Z"),
  accountingPeriod: new Date("2026-01-01T00:00:00.000Z"),
  currency: "ARS",
  exchangeRate: new Decimal("1.0000"),
  subtotal: new Decimal("100.00"),
  vatAmount: new Decimal("21.00"),
  nonTaxableAmount: new Decimal("0.00"),
  exemptAmount: new Decimal("0.00"),
  otherTaxesAmount: new Decimal("0.00"),
  totalAmount: new Decimal("121.00"),
  netAmount: new Decimal("121.00"),
  concept: null,
  paymentMethod: "transfer",
  status: "paid",
  paymentDate: null,
  paidAmount: new Decimal("0.00"),
  comments: null,
  createdByUserId: "user-1",
  createdAt: new Date("2026-01-15T00:00:00.000Z"),
  updatedAt: new Date("2026-01-15T00:00:00.000Z"),
  retentions: [],
  perceptions: [{ id: "perception-1", voucherId: "voucher-1", perceptionConceptId: "perc-1", taxJurisdictionId: null, amount: new Decimal("3.00"), perceptionConcept: { name: "Percepción" }, taxJurisdiction: null }],
  vatDetails: [],
  voucherType: { name: "Factura" },
  voucherLetter: { letter: "A" },
  client: null,
  supplier: { name: "Proveedor", cuit: "30111111119" },
}

describe("Voucher persistence adapter", () => {
  it("maps Prisma records to factory input without exposing Prisma values", () => {
    const input = mapPrismaVoucherToDomainInput(prismaVoucherRecord)

    expect(input.totalAmount).toBe("121.00")
    expect(input.currency).toBe("ARS")
    expect(input.supplier?.cuit).toBe("30111111119")
    expect(input).not.toHaveProperty("voucherType")
  })

  it("serializes domain vouchers through one common representation", () => {
    const voucher = VoucherFactory.rehydrate(mapPrismaVoucherToDomainInput(prismaVoucherRecord))
    const serialized = serializeVoucher(voucher)

    expect(serialized).toMatchObject({
      id: "voucher-1",
      totalAmount: "121.00",
      saldo: "121.00",
      currency: "ARS",
      status: "paid",
      supplierId: "supplier-1",
      supplier: { name: "Proveedor", cuit: "30111111119" },
      voucherType: { name: "Factura" },
      voucherLetter: { letter: "A" },
      retentions: [],
      perceptions: [{ perceptionConceptId: "perc-1", amount: "3.00", conceptName: "Percepción", taxJurisdictionName: null }],
    })
    expect(typeof serialized.totalAmount).toBe("string")
    expect(serialized).not.toHaveProperty("amount")
  })

  it("maps domain vouchers to Prisma data using the common snapshot", () => {
    const voucher = VoucherFactory.rehydrate(mapPrismaVoucherToDomainInput(prismaVoucherRecord))
    const data = mapVoucherToPrismaData(voucher)

    expect(data).toMatchObject({ companyId: "company-1", totalAmount: "121.00", currency: "ARS", supplierId: "supplier-1" })
  })
})
