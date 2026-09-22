/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import DashboardPage from "src/app/(dashboard)/dashboard/page"
import { DashboardView } from "src/components/dashboard/dashboard-view"

const useMetricsMock = jest.fn()
const useDashboardActivityMock = jest.fn()
const useCompanyMock = jest.fn()

jest.mock("src/hooks/metric/use-metrics", () => ({
  useMetrics: () => useMetricsMock(),
}))

jest.mock("src/hooks/dashboard/use-dashboard-activity", () => ({
  useDashboardActivity: () => useDashboardActivityMock(),
}))

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => useCompanyMock(),
}))

jest.mock("src/components/dashboard/kpi-cards", () => ({
  KpiCards: () => <div data-testid="dashboard-kpi-cards">kpi-cards</div>,
}))

jest.mock("src/components/dashboard/recent-activity", () => ({
  RecentActivity: () => <div data-testid="dashboard-recent-activity">recent-activity</div>,
}))

jest.mock("src/components/dashboard/dashboard-skeleton", () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-page-skeleton">dashboard-page-skeleton</div>,
}))

describe("DashboardView", () => {
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
  })

  it("renders the resolved dashboard sections once dashboard metrics and activity data are ready", async () => {
    useMetricsMock.mockReturnValue({
      data: {
        currentMonth: { collections: { ARS: 1000 }, payments: { ARS: 500 }, balance: { ARS: 500 }, margin: { ARS: 50 } },
        variations: { collections: { absolute: 100, percentage: 10 }, payments: { absolute: 50, percentage: 10 }, balance: { absolute: 50, percentage: 10 } },
      },
      isLoading: false,
    })
    useDashboardActivityMock.mockReturnValue({
      data: {
        weeklySales: [],
        recentPurchases: [],
      },
      isLoading: false,
    })

    render(<DashboardView />)

    expect(await screen.findByTestId("dashboard-kpi-cards")).toBeInTheDocument()
    expect(await screen.findByTestId("dashboard-recent-activity")).toBeInTheDocument()
  })

  it("renders dashboard sections without relying on route-level skeleton placeholders after resolution", () => {
    useMetricsMock.mockReturnValue({
      data: {
        currentMonth: { collections: { ARS: 1000 }, payments: { ARS: 500 }, balance: { ARS: 500 }, margin: { ARS: 50 } },
        variations: { collections: { absolute: 100, percentage: 10 }, payments: { absolute: 50, percentage: 10 }, balance: { absolute: 50, percentage: 10 } },
      },
      isLoading: false,
    })
    useDashboardActivityMock.mockReturnValue({
      data: {
        weeklySales: [],
        recentPurchases: [],
      },
      isLoading: false,
    })

    render(<DashboardView />)

    expect(screen.getByTestId("dashboard-kpi-cards")).toBeInTheDocument()
    expect(screen.getByTestId("dashboard-recent-activity")).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-kpi-skeleton")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-recent-activity-skeleton")).not.toBeInTheDocument()
  })

  it("does not depend on voucher hooks for the dashboard route", () => {
    useMetricsMock.mockReturnValue({
      data: {
        currentMonth: { collections: { ARS: 1000 }, payments: { ARS: 500 }, balance: { ARS: 500 }, margin: { ARS: 50 } },
        variations: { collections: { absolute: 100, percentage: 10 }, payments: { absolute: 50, percentage: 10 }, balance: { absolute: 50, percentage: 10 } },
      },
      isLoading: false,
    })
    useDashboardActivityMock.mockReturnValue({
      data: {
        weeklySales: [],
        recentPurchases: [],
      },
      isLoading: false,
    })

    render(<DashboardView />)

    expect(useDashboardActivityMock).toHaveBeenCalledTimes(1)
  })

  it("keeps the dashboard page file as a mount-only route entry", () => {
    expect(typeof DashboardPage).toBe("function")
  })

  it("does not mount data-bound dashboard sections when there is no active company yet", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: null,
      companies: [],
      activeCompany: null,
      setActiveCompanyId: jest.fn(),
      loading: false,
      refreshCompanies: jest.fn(),
    })

    render(<DashboardView />)

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-kpi-cards")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-recent-activity")).not.toBeInTheDocument()
    expect(useMetricsMock).not.toHaveBeenCalled()
    expect(useDashboardActivityMock).not.toHaveBeenCalled()
  })

  it("does not mount dashboard data sections while company scope is still loading", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      companies: [],
      activeCompany: null,
      setActiveCompanyId: jest.fn(),
      loading: true,
      refreshCompanies: jest.fn(),
    })

    render(<DashboardView />)

    expect(screen.getByTestId("dashboard-page-skeleton")).toBeInTheDocument()
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-kpi-cards")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-recent-activity")).not.toBeInTheDocument()
    expect(useMetricsMock).not.toHaveBeenCalled()
    expect(useDashboardActivityMock).not.toHaveBeenCalled()
  })

  it("keeps a full dashboard skeleton visible while route data is still loading", () => {
    useMetricsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    })
    useDashboardActivityMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<DashboardView />)

    expect(screen.getByTestId("dashboard-page-skeleton")).toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-kpi-cards")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dashboard-recent-activity")).not.toBeInTheDocument()
  })
})
