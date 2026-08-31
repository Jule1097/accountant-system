/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import { createElement } from "react"
import AnalyticsPage from "src/app/(dashboard)/analytics/page"
import { AnalyticsView } from "src/components/analytics/analytics-view"

const useAnalyticsMock = jest.fn()
const useVouchersMock = jest.fn()
const useVoucherSummaryMock = jest.fn()
const useVoucherByIdMock = jest.fn()
const useCompanyMock = jest.fn()

jest.mock("src/hooks/analytics/use-analytics", () => ({
  useAnalytics: () => useAnalyticsMock(),
}))

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => useCompanyMock(),
}))

jest.mock("src/hooks/voucher/use-vouchers", () => ({
  useVouchers: (...args: unknown[]) => useVouchersMock(...args),
  useVoucherSummary: (...args: unknown[]) => useVoucherSummaryMock(...args),
  useVoucherById: (...args: unknown[]) => useVoucherByIdMock(...args),
}))

describe("Analytics Module Exports", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      companies: [],
      activeCompany: null,
      setActiveCompanyId: jest.fn(),
      loading: false,
      refreshCompanies: jest.fn(),
    })
    useAnalyticsMock.mockReturnValue({
      data: {
        monthly: {
          netSales: { ARS: 0, USD: 0 },
          netPurchases: { ARS: 0, USD: 0 },
          salesCreditNotes: { ARS: 0, USD: 0 },
          purchasesCreditNotes: { ARS: 0, USD: 0 },
          vatDebit: { ARS: 0, USD: 0 },
          vatCredit: { ARS: 0, USD: 0 },
          vatNetBalance: { ARS: 0, USD: 0 },
          retentions: [],
          perceptions: [],
          topClients: [],
          topSuppliers: [],
        },
        semiannual: {
          netSales: { ARS: 0, USD: 0 },
          netPurchases: { ARS: 0, USD: 0 },
          salesCreditNotes: { ARS: 0, USD: 0 },
          purchasesCreditNotes: { ARS: 0, USD: 0 },
          vatDebit: { ARS: 0, USD: 0 },
          vatCredit: { ARS: 0, USD: 0 },
          vatNetBalance: { ARS: 0, USD: 0 },
          retentions: [],
          perceptions: [],
          topClients: [],
          topSuppliers: [],
        },
        annual: {
          netSales: { ARS: 0, USD: 0 },
          netPurchases: { ARS: 0, USD: 0 },
          salesCreditNotes: { ARS: 0, USD: 0 },
          purchasesCreditNotes: { ARS: 0, USD: 0 },
          vatDebit: { ARS: 0, USD: 0 },
          vatCredit: { ARS: 0, USD: 0 },
          vatNetBalance: { ARS: 0, USD: 0 },
          retentions: [],
          perceptions: [],
          topClients: [],
          topSuppliers: [],
        },
        trend: {
          ARS: [],
          USD: [],
        },
      },
      isLoading: false,
    })
  })

  it("should export AnalyticsPage as a function", () => {
    expect(typeof AnalyticsPage).toBe("function")
  })

  it("should export AnalyticsView as a function", () => {
    expect(typeof AnalyticsView).toBe("function")
  })

  it("keeps analytics route data isolated from voucher hooks", () => {
    render(createElement(AnalyticsView))

    expect(useAnalyticsMock).toHaveBeenCalledTimes(1)
    expect(useVouchersMock).not.toHaveBeenCalled()
    expect(useVoucherSummaryMock).not.toHaveBeenCalled()
    expect(useVoucherByIdMock).not.toHaveBeenCalled()
    expect(screen.getByText("Analíticas")).toBeInTheDocument()
  })

  it("does not mount analytics data sections when there is no active company yet", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: null,
      companies: [],
      activeCompany: null,
      setActiveCompanyId: jest.fn(),
      loading: false,
      refreshCompanies: jest.fn(),
    })

    render(createElement(AnalyticsView))

    expect(screen.getByText("Analíticas")).toBeInTheDocument()
    expect(screen.queryByText("Facturación del Mes")).not.toBeInTheDocument()
    expect(screen.queryByText("Comparación Mensual vs Período Anterior")).not.toBeInTheDocument()
    expect(useAnalyticsMock).not.toHaveBeenCalled()
  })

  it("keeps a full analytics skeleton visible while company scope is still loading", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      companies: [],
      activeCompany: null,
      setActiveCompanyId: jest.fn(),
      loading: true,
      refreshCompanies: jest.fn(),
    })

    render(createElement(AnalyticsView))

    expect(screen.getByTestId("analytics-page-skeleton")).toBeInTheDocument()
    expect(screen.queryByText("Analíticas")).not.toBeInTheDocument()
    expect(screen.queryByText("Facturación del Mes")).not.toBeInTheDocument()
    expect(useAnalyticsMock).not.toHaveBeenCalled()
  })

  it("keeps a full analytics skeleton visible while analytics data is still loading", () => {
    useAnalyticsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(createElement(AnalyticsView))

    expect(screen.getByTestId("analytics-page-skeleton")).toBeInTheDocument()
    expect(screen.queryByText("Facturación del Mes")).not.toBeInTheDocument()
  })
})
