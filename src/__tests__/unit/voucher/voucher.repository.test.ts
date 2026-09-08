import { Decimal } from "decimal.js"
import prisma from "src/lib/database/prisma"
import { VoucherFactory } from "src/models/voucher/VoucherFactory"
import { VoucherRepository } from "src/repositories/voucher/voucher.repository"
import { VoucherPersistenceRecord } from "src/types/voucher/voucher-persistence"

jest.mock("src/lib/database/prisma", () => ({ __esModule: true, default: { voucher: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } } }))

const mockPrisma = {
  voucher: {
    findUnique: prisma.voucher.findUnique as jest.Mock,
    findFirst: prisma.voucher.findFirst as jest.Mock,
    findMany: prisma.voucher.findMany as jest.Mock,
    count: prisma.voucher.count as jest.Mock,
    create: prisma.voucher.create as jest.Mock,
    update: prisma.voucher.update as jest.Mock,
    delete: prisma.voucher.delete as jest.Mock,
  },
}

const persistedPurchase = {
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
  perceptions: [],
  vatDetails: [],
  voucherType: { name: "Factura" },
  voucherLetter: { letter: "A" },
  client: null,
  supplier: { name: "Proveedor", cuit: "30111111119" },
} as VoucherPersistenceRecord

describe("VoucherRepository", () => {
  let repository: VoucherRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new VoucherRepository()
  })

  it("rehydrates Prisma records into concrete domain vouchers", async () => {
    mockPrisma.voucher.findUnique.mockResolvedValue(persistedPurchase)

    const result = await repository.findById("company-1", "voucher-1")

    expect(result).toMatchObject({ totalAmount: { toString: expect.any(Function) }, supplierId: "supplier-1", supplier: { name: "Proveedor" } })
    expect(result?.totalAmount.toString()).toBe("121.00")
  })

  it("uses a stable identifier tie-breaker for paginated voucher results", async () => {
    mockPrisma.voucher.count.mockResolvedValue(2)
    mockPrisma.voucher.findMany.mockResolvedValue([])

    await repository.findPage("company-1", 1, 10, { type: "sale", sortBy: "date", sortOrder: "desc" })

    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ date: "desc" }, { id: "desc" }] }))
  })

  it("persists domain vouchers through the persistence mapper and rehydrates the result", async () => {
    const voucher = VoucherFactory.rehydrate({
      ...{
        id: "voucher-1",
        companyId: "company-1",
        type: "purchase",
        voucherTypeId: "voucher-type-1",
        voucherTypeName: "Factura",
        voucherTypeCategory: "standard",
        voucherLetterId: "voucher-letter-1",
        voucherLetter: "A",
        posNumber: "00001",
        number: "00000001",
        date: "2026-01-15T00:00:00.000Z",
        accountingPeriod: "2026-01-01T00:00:00.000Z",
        currency: "ARS",
        exchangeRate: "1.0000",
        subtotal: "100.00",
        vatAmount: "21.00",
        nonTaxableAmount: "0.00",
        exemptAmount: "0.00",
        otherTaxesAmount: "0.00",
        totalAmount: "121.00",
        netAmount: "121.00",
        saldo: "121.00",
        paidAmount: "0.00",
        paymentMethod: "transfer",
        paymentDate: null,
        status: "paid",
        concept: null,
        comments: null,
        createdByUserId: "user-1",
        supplierId: "supplier-1",
        supplier: { name: "Proveedor", cuit: "30111111119" },
        perceptions: [],
        vatDetails: [],
      },
    })
    mockPrisma.voucher.create.mockResolvedValue(persistedPurchase)

    const result = await repository.create(voucher)
    const createCall = mockPrisma.voucher.create.mock.calls[0][0]

    expect(createCall.data).toMatchObject({ companyId: "company-1", totalAmount: "121.00", supplierId: "supplier-1" })
    expect(createCall.data).not.toHaveProperty("saldo")
    expect(result?.type).toBe("purchase")
    expect(result.totalAmount.toString()).toBe("121.00")
  })

  it("updates vouchers through relation connections instead of relation scalar fields", async () => {
    const voucher = VoucherFactory.rehydrate({
      id: "voucher-1",
      companyId: "company-1",
      type: "sale",
      voucherTypeId: "voucher-type-1",
      voucherTypeName: "Factura",
      voucherTypeCategory: "standard",
      voucherLetterId: "voucher-letter-1",
      voucherLetter: "A",
      posNumber: "00001",
      number: "00000001",
      date: "2026-01-15T00:00:00.000Z",
      accountingPeriod: "2026-01-01T00:00:00.000Z",
      currency: "ARS",
      exchangeRate: "1.0000",
      subtotal: "100.00",
      vatAmount: "21.00",
      nonTaxableAmount: "0.00",
      exemptAmount: "0.00",
      otherTaxesAmount: "0.00",
      totalAmount: "121.00",
      netAmount: "121.00",
      saldo: "121.00",
      paidAmount: "0.00",
      paymentMethod: "transfer",
      paymentDate: null,
      status: "paid",
      concept: null,
      comments: null,
      createdByUserId: "user-1",
      clientId: "client-1",
      client: { name: "Cliente", cuit: "20111111112" },
      retentions: [{ retentionConceptId: "retention-1", taxJurisdictionId: "jurisdiction-1", amount: "200.50" }],
      perceptions: [],
      vatDetails: [],
    })
    mockPrisma.voucher.update.mockResolvedValue({ ...persistedPurchase, type: "sale", clientId: "client-1", supplierId: null, client: { name: "Cliente", cuit: "20111111112" }, supplier: null })

    await repository.update(voucher)

    const updateCall = mockPrisma.voucher.update.mock.calls[0][0]

    expect(updateCall.data).toMatchObject({
      voucherType: { connect: { id: "voucher-type-1" } },
      voucherLetter: { connect: { id: "voucher-letter-1" } },
      createdByUser: { connect: { id: "user-1" } },
      client: { connect: { id: "client-1" } },
      supplier: { disconnect: true },
      retentions: {
        deleteMany: {},
        create: [{ retentionConcept: { connect: { id: "retention-1" } }, taxJurisdiction: { connect: { id: "jurisdiction-1" } }, amount: "200.50" }],
      },
    })
    expect(updateCall.data).not.toHaveProperty("voucherTypeId")
    expect(updateCall.data).not.toHaveProperty("voucherLetterId")
    expect(updateCall.data).not.toHaveProperty("createdByUserId")
    expect(updateCall.data).not.toHaveProperty("clientId")
    expect(updateCall.data).not.toHaveProperty("supplierId")
    expect(updateCall.data).not.toHaveProperty("saldo")
  })

  it("preserves credit note behavior when rehydrating historical records", async () => {
    mockPrisma.voucher.findUnique.mockResolvedValue({ ...persistedPurchase, type: "sale", clientId: "client-1", supplierId: null, client: { name: "Cliente", cuit: "20111111112" }, supplier: null, voucherType: { name: "Nota de Credito" } })

    const result = await repository.findById("company-1", "voucher-1")

    expect(result?.isCreditNote()).toBe(true)
  })
})
