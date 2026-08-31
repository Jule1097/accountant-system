/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import { JSX } from "react/jsx-runtime"

const pendingPromise = new Promise(() => undefined)

function loadDashboardPage() {
  jest.resetModules()
  jest.doMock("src/components/dashboard/dashboard-view", () => ({
    DashboardView: () => {
      throw pendingPromise
    },
  }))
  jest.doMock("src/components/dashboard/dashboard-skeleton", () => ({
    DashboardSkeleton: () => <div data-testid="dashboard-page-skeleton">dashboard-page-skeleton</div>,
  }))

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("src/app/(dashboard)/dashboard/page").default as () => JSX.Element
}

function loadAnalyticsPage() {
  jest.resetModules()
  jest.doMock("src/components/analytics/analytics-view", () => ({
    AnalyticsView: () => {
      throw pendingPromise
    },
  }))
  jest.doMock("src/components/analytics/analytics-skeleton", () => ({
    AnalyticsSkeleton: () => <div data-testid="analytics-route-skeleton">analytics-route-skeleton</div>,
  }))

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("src/app/(dashboard)/analytics/page").default as () => JSX.Element
}

describe("dashboard route loading contract", () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("renders dashboard route fallbacks from the page suspense boundary", () => {
    const DashboardPage = loadDashboardPage()

    render(<DashboardPage />)

    expect(screen.getByTestId("dashboard-page-skeleton")).toBeInTheDocument()
  })

  it("renders analytics route fallback from the page suspense boundary", () => {
    const AnalyticsPage = loadAnalyticsPage()

    render(<AnalyticsPage />)

    expect(screen.getByTestId("analytics-route-skeleton")).toBeInTheDocument()
  })
})
