import { AnalyticsService } from "src/services/analytics/Analytics"
import { VoucherFactory } from "src/models/voucher/VoucherFactory"
import { MetricRepository } from "src/repositories/metric/MetricRepository"

jest.mock("src/repositories/metric/MetricRepository")

describe("AnalyticsService", () => {
  let service: AnalyticsService
  let repositoryMock: jest.Mocked<MetricRepository>

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-03-15T12:00:00.000Z"))
    jest.clearAllMocks()
    repositoryMock = new MetricRepository() as jest.Mocked<MetricRepository>
    service = new AnalyticsService()
    Object.defineProperty(service, "repository", { value: repositoryMock, writable: true })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("requests the previous December and current calendar year records", async () => {
    repositoryMock.findForPeriod.mockResolvedValue([])

    await service.getAnalytics("company-test-uuid")

    expect(repositoryMock.findForPeriod).toHaveBeenCalledWith("company-test-uuid", new Date("2025-01-01T00:00:00.000Z"), new Date("2027-01-01T00:00:00.000Z"))
  })

  it("returns current-month cash metrics and a twelve-month trend with dynamic currencies", async () => {
    const sale = VoucherFactory.rehydrate({ companyId: "company-test-uuid", type: "sale", voucherTypeId: "voucher-type-sale", voucherTypeCategory: "standard", voucherLetterId: "voucher-letter-sale", posNumber: "00001", number: "00000001", clientId: "client-1", subtotal: 1000, vatAmount: 210, totalAmount: 1210, netAmount: 1210, paidAmount: 500, paymentDate: "2026-03-10", date: "2026-03-01", accountingPeriod: "2026-03-01", currency: "ARS", exchangeRate: 1, retentions: [], perceptions: [], vatDetails: [], client: { name: "Client A", cuit: "20-11111111-2" }, createdByUserId: "user-1" })
    const purchase = VoucherFactory.rehydrate({ companyId: "company-test-uuid", type: "purchase", voucherTypeId: "voucher-type-purchase", voucherTypeCategory: "standard", voucherLetterId: "voucher-letter-purchase", posNumber: "00001", number: "00000002", supplierId: "supplier-1", subtotal: 300, vatAmount: 63, totalAmount: 363, netAmount: 363, paidAmount: 100, paymentDate: "2026-03-12", date: "2026-03-01", accountingPeriod: "2026-03-01", currency: "USD", exchangeRate: 1000, retentions: [], perceptions: [], vatDetails: [], supplier: { name: "Supplier A", cuit: "30-22222222-3" }, createdByUserId: "user-1" })
    repositoryMock.findForPeriod.mockResolvedValue([sale, purchase])

    const result = await service.getAnalytics("company-test-uuid")

    expect(result.currentMonth.collections).toEqual({ ARS: 500 })
    expect(result.currentMonth.payments).toEqual({ USD: 100 })
    expect(result.currentMonth.balance).toEqual({ ARS: 500, USD: -100 })
    expect(result.annual.collections).toEqual({ ARS: 500 })
    expect(result.annualVariations.collections).toEqual({ ARS: { absolute: 500, percentage: null } })
    expect(result.annual.salesByClient.ARS).toEqual([{ clientId: "client-1", name: "Client A", total: 500, currency: "ARS" }])
    expect(result.trend).toHaveLength(12)
    expect(result.trend[2]).toMatchObject({ month: "Marzo", cobros: { ARS: 500 }, pagos: { USD: 100 } })
  })
})
