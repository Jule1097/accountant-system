import { clientSupplierListQuerySchema, clientSupplierSchema } from "src/lib/schemas/third-party/third-party-schemas"
import { conciliationsQuerySchema, conciliationBulkPersistSchema } from "src/lib/schemas/conciliation/conciliations-schemas"
import { parserBatchUploadSchema } from "src/lib/schemas/parser/parser-batch-schemas"
import { voucherExportQuerySchema } from "src/lib/schemas/voucher/voucher-export-schemas"
import { voucherListQuerySchema, voucherSchema, voucherSummaryQuerySchema } from "src/lib/schemas/voucher/voucher-schemas"
import { buildClientSupplierWhereClause } from "src/lib/helpers/third-party/third-party-persistence"

const validUuid = "11111111-1111-4111-8111-111111111111"

function createValidVoucherPayload(): Record<string, unknown> {
  return {
    companyId: validUuid,
    type: "sale",
    voucherTypeId: validUuid,
    voucherLetterId: validUuid,
    posNumber: "1",
    number: "1",
    clientId: validUuid,
    date: "2026-09-09",
    currency: "$",
    exchangeRate: 1,
    subtotal: 100,
    vatAmount: 21,
    totalAmount: 121,
    paymentMethod: "transfer",
    status: "pending",
    createdByUserId: validUuid,
  }
}

describe("untrusted input validation security boundary", () => {
  it("rejects unknown fields instead of silently accepting mass-assignment payloads", () => {
    expect(clientSupplierSchema.safeParse({ name: "Acme", cuit: "30111111119", role: "admin" }).success).toBe(false)
    expect(parserBatchUploadSchema.safeParse({ voucherType: "sale", companyId: validUuid }).success).toBe(false)
    expect(voucherSchema.safeParse({ ...createValidVoucherPayload(), role: "admin" }).success).toBe(false)
  })

  it("limits third-party names and search terms", () => {
    expect(clientSupplierSchema.safeParse({ name: "A".repeat(256), cuit: "30111111119" }).success).toBe(false)
    expect(clientSupplierListQuerySchema.safeParse({ search: "A".repeat(513) }).success).toBe(false)
  })

  it("limits voucher concepts and comments", () => {
    expect(voucherSchema.safeParse({ ...createValidVoucherPayload(), concept: "A".repeat(10001) }).success).toBe(false)
    expect(voucherSchema.safeParse({ ...createValidVoucherPayload(), comments: "A".repeat(10001) }).success).toBe(false)
  })

  it("limits voucher search terms", () => {
    expect(voucherListQuerySchema.safeParse({ type: "sale", search: "A".repeat(256) }).success).toBe(false)
    expect(voucherExportQuerySchema.safeParse({ mode: "filters", type: "sale", search: "A".repeat(256) }).success).toBe(false)
  })

  it.each([
    ["subtotal", Number.NaN],
    ["vatAmount", Number.POSITIVE_INFINITY],
    ["totalAmount", Number.MAX_VALUE],
  ])("rejects non-finite or extreme monetary input for %s", (field, value) => {
    expect(voucherSchema.safeParse({ ...createValidVoucherPayload(), [field]: value }).success).toBe(false)
  })

  it("rejects monetary input with more than two decimal places", () => {
    expect(voucherSchema.safeParse({ ...createValidVoucherPayload(), totalAmount: 121.001 }).success).toBe(false)
  })

  it("rejects invalid UUIDs, dates, enums, and pagination", () => {
    expect(voucherSchema.safeParse({ ...createValidVoucherPayload(), companyId: "not-a-uuid" }).success).toBe(false)
    expect(voucherSchema.safeParse({ ...createValidVoucherPayload(), date: "not-a-date" }).success).toBe(false)
    expect(voucherListQuerySchema.safeParse({ type: "admin" }).success).toBe(false)
    expect(voucherListQuerySchema.safeParse({ type: "sale", page: 0 }).success).toBe(false)
    expect(voucherSummaryQuerySchema.safeParse({ type: "sale", pageSize: 100000 }).success).toBe(false)
    expect(voucherExportQuerySchema.safeParse({ mode: "filters", type: "sale", dateFrom: "not-a-date" }).success).toBe(false)
    expect(conciliationsQuerySchema.safeParse({ tab: "sales", page: 0 }).success).toBe(false)
  })

  it("limits bulk mutation payload size", () => {
    const itemIds = Array.from({ length: 1001 }, (_, index) => `${String(index).padStart(8, "0")}-1111-4111-8111-111111111111`)

    expect(conciliationBulkPersistSchema.safeParse({ itemIds }).success).toBe(false)
  })

  it("treats SQL metacharacters as query data", () => {
    const search = "' OR 1=1 --"
    const whereClause = buildClientSupplierWhereClause(validUuid, { search })

    expect(whereClause.companyId).toBe(validUuid)
    expect(JSON.stringify(whereClause)).toContain(search)
  })
})
