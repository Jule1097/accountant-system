import { VoucherFactory } from "src/models/voucher/VoucherFactory"
import { buildAnnualTrend, calculateCashMetrics, calculateDocumentMetrics, calculateMonthlyVariation, calculatePendingCount, calculatePendingMetrics, calculatePurchaseDistribution, calculateSalesByClient, calculateTaxTotals, calculateVoucherSummary, getEffectiveCashDate } from "src/lib/helpers/metric/metric-calculations"
import type { VoucherFactoryInput } from "src/types/voucher/domain"

const baseInput: VoucherFactoryInput = {
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
  nonTaxableAmount: "10.00",
  exemptAmount: "5.00",
  otherTaxesAmount: "4.00",
  totalAmount: "140.00",
  netAmount: "140.00",
  saldo: "40.00",
  paidAmount: "100.00",
  paymentMethod: "transfer",
  paymentDate: "2026-01-20",
  status: "partial",
  concept: null,
  comments: null,
  createdByUserId: "user-1",
  retentions: [],
  perceptions: [],
  vatDetails: [],
}

function buildVoucher(overrides: Partial<VoucherFactoryInput> = {}) {
  return VoucherFactory.rehydrate({ ...baseInput, ...overrides })
}

describe("analytics calculations", () => {
  const currentDate = new Date("2026-03-15T12:00:00.000Z")

  it("resolves payment date before accounting period and excludes future effective payments", () => {
    const withPaymentDate = buildVoucher({ paymentDate: "2026-02-20", accountingPeriod: "2026-01-01" })
    const withoutPaymentDate = buildVoucher({ id: "voucher-2", paymentDate: null, accountingPeriod: "2026-01-01" })
    const futurePayment = buildVoucher({ id: "voucher-3", paymentDate: "2026-04-01", accountingPeriod: "2026-01-01" })

    expect(getEffectiveCashDate(withPaymentDate)).toEqual(new Date("2026-02-20"))
    expect(getEffectiveCashDate(withoutPaymentDate)).toEqual(new Date("2026-01-01"))
    expect(calculateCashMetrics([withPaymentDate, withoutPaymentDate, futurePayment], { start: new Date("2026-01-01"), end: new Date("2026-04-01"), now: currentDate })).toEqual({
      collections: { ARS: 200 },
      payments: {},
      balance: { ARS: 200 },
      margin: { ARS: 100 },
    })
  })

  it("calculates signed cash, document, and pending metrics by currency", () => {
    const sale = buildVoucher({ paidAmount: "80.00", netAmount: "130.00", saldo: "50.00" })
    const saleCreditNote = buildVoucher({ id: "voucher-2", voucherTypeCategory: "credit_note", paidAmount: "20.00", netAmount: "20.00", saldo: "0.00", status: "paid" })
    const purchase = buildVoucher({ id: "voucher-3", type: "purchase", clientId: null, supplierId: "supplier-1", currency: "USD", subtotal: "200.00", vatAmount: "42.00", totalAmount: "242.00", netAmount: "242.00", paidAmount: "100.00", saldo: "142.00", paymentDate: "2026-01-10", perceptions: [{ perceptionConceptId: "perception-1", amount: "10.00", conceptName: "Ingresos Brutos" }] })

    expect(calculateCashMetrics([sale, saleCreditNote, purchase], { start: new Date("2026-01-01"), end: new Date("2026-02-01"), now: currentDate })).toEqual({
      collections: { ARS: 60 },
      payments: { USD: 100 },
      balance: { ARS: 60, USD: -100 },
      margin: { ARS: 100, USD: null },
    })
    expect(calculateDocumentMetrics([sale, saleCreditNote, purchase])).toEqual({ sales: { ARS: 110 }, purchases: { USD: 271 } })
    expect(calculatePendingCount([sale, saleCreditNote, purchase])).toBe(2)
    expect(calculatePendingMetrics([sale, saleCreditNote, purchase])).toEqual({ count: 2, amount: { ARS: 50, USD: 142 } })
  })

  it("separates fiscal and non-fiscal purchase components and aggregates taxes by concept and currency", () => {
    const fiscalPurchase = buildVoucher({ type: "purchase", clientId: null, supplierId: "supplier-1", subtotal: "100.00", vatAmount: "21.00", nonTaxableAmount: "10.00", exemptAmount: "5.00", otherTaxesAmount: "4.00", totalAmount: "140.00", netAmount: "140.00", paidAmount: "0.00", status: "pending", perceptions: [{ perceptionConceptId: "perception-1", amount: "7.00", conceptName: "Ingresos Brutos", taxJurisdictionName: "CABA" }] })
    const nonFiscalPurchase = buildVoucher({ id: "voucher-2", type: "purchase", clientId: null, supplierId: "supplier-2", documentIdentificationMode: "non_fiscal", voucherLetterId: null, posNumber: null, number: null, subtotal: "50.00", vatAmount: "10.50", nonTaxableAmount: "3.00", exemptAmount: "2.00", otherTaxesAmount: "1.00", totalAmount: "66.50", netAmount: "66.50", perceptions: [{ perceptionConceptId: "perception-1", amount: "2.00", conceptName: "Ingresos Brutos", taxJurisdictionName: "Buenos Aires" }] })
    const creditNote = buildVoucher({ id: "voucher-3", type: "purchase", clientId: null, supplierId: "supplier-1", voucherTypeCategory: "credit_note", subtotal: "20.00", vatAmount: "4.20", nonTaxableAmount: "1.00", exemptAmount: "0.00", otherTaxesAmount: "0.00", totalAmount: "25.20", netAmount: "25.20", perceptions: [{ perceptionConceptId: "perception-1", amount: "1.00", conceptName: "Ingresos Brutos", taxJurisdictionName: "CABA" }] })

    expect(calculatePurchaseDistribution([fiscalPurchase, nonFiscalPurchase, creditNote])).toEqual([
      { id: "fiscal", amount: 120.8, percentage: 64 },
      { id: "non_fiscal", amount: 68.5, percentage: 36 },
    ])
    expect(calculateTaxTotals([fiscalPurchase, nonFiscalPurchase, creditNote])).toEqual({
      retentions: [],
      perceptions: [{ concept: "Ingresos Brutos", currency: "ARS", total: 8 }],
    })
  })

  it("builds a January-to-December trend with zero future months and month variations", () => {
    const januarySale = buildVoucher({ paidAmount: "100.00", paymentDate: "2026-01-10" })
    const marchPurchase = buildVoucher({ id: "voucher-2", type: "purchase", clientId: null, supplierId: "supplier-1", paidAmount: "40.00", paymentDate: "2026-03-10" })

    const trend = buildAnnualTrend([januarySale, marchPurchase], 2026, currentDate)

    expect(trend).toHaveLength(12)
    expect(trend[0]).toMatchObject({ month: "Enero", cobros: { ARS: 100 }, pagos: {} })
    expect(trend[2]).toMatchObject({ month: "Marzo", cobros: {}, pagos: { ARS: 40 } })
    expect(trend[3]).toMatchObject({ month: "Abril", cobros: {}, pagos: {} })
    expect(calculateMonthlyVariation(100, 0)).toEqual({ absolute: 100, percentage: null })
    expect(calculateMonthlyVariation(80, 100)).toEqual({ absolute: -20, percentage: -20 })
  })

  it("builds filtered sales and purchases summaries from the complete result", () => {
    const sale = buildVoucher({ client: { name: "Client A", cuit: "20-11111111-2" }, paidAmount: "80.00", netAmount: "130.00", saldo: "50.00" })
    const creditNote = buildVoucher({ id: "voucher-2", client: { name: "Client A", cuit: "20-11111111-2" }, voucherTypeCategory: "credit_note", paidAmount: "20.00", netAmount: "20.00", saldo: "0.00", status: "paid" })

    expect(calculateVoucherSummary([sale, creditNote], "sale")).toEqual({
      totalCount: 2,
      documentTotal: { ARS: 110 },
      cashTotal: { ARS: 60 },
      topParty: { ARS: { name: "Client A", total: 60 } },
      pendingCount: 1,
      nonFiscalAmount: {},
    })
  })

  it("aggregates all effectively collected sales by client, currency, and signed amount", () => {
    const clientA = buildVoucher({ clientId: "client-a", client: { name: "Client A", cuit: "20-11111111-2" }, paidAmount: "80.00", paymentDate: "2026-02-10" })
    const clientACreditNote = buildVoucher({ id: "voucher-2", clientId: "client-a", client: { name: "Client A", cuit: "20-11111111-2" }, voucherTypeCategory: "credit_note", paidAmount: "20.00", paymentDate: "2026-02-11", status: "paid" })
    const clientB = buildVoucher({ id: "voucher-3", clientId: "client-b", client: { name: "Client B", cuit: "27-22222222-3" }, paidAmount: "150.00", paymentDate: "2026-03-10" })
    const clientUsd = buildVoucher({ id: "voucher-4", clientId: "client-c", client: { name: "Client C", cuit: "30-33333333-4" }, currency: "USD", paidAmount: "300.00", paymentDate: "2026-03-10" })

    expect(calculateSalesByClient([clientA, clientACreditNote, clientB, clientUsd], { start: new Date("2026-01-01"), end: new Date("2026-04-01"), now: currentDate })).toEqual({
      ARS: [
        { clientId: "client-b", name: "Client B", total: 150, currency: "ARS" },
        { clientId: "client-a", name: "Client A", total: 60, currency: "ARS" },
      ],
      USD: [{ clientId: "client-c", name: "Client C", total: 300, currency: "USD" }],
    })
  })
})
