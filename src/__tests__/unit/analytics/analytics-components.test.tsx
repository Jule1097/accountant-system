/** @jest-environment jsdom */

import { fireEvent, render, renderHook, screen } from "@testing-library/react"
import { AnalyticsExpenseDistribution } from "src/components/analytics/analytics-expense-distribution"
import { AnalyticsHeader } from "src/components/analytics/analytics-header"
import { AnalyticsSalesByClient } from "src/components/analytics/analytics-sales-by-client"
import { AnalyticsSummaryCards } from "src/components/analytics/analytics-summary-cards"
import { useAnalyticsChart } from "src/hooks/analytics/use-analytics-chart"
import type { AnalyticsData, AnalyticsPeriodMetrics, AnalyticsTrendEntry } from "src/types/analytics/analytics"

function createPeriodMetrics(): AnalyticsPeriodMetrics {
  return {
    collections: { ARS: 1250 },
    payments: { ARS: 450 },
    balance: { ARS: 800 },
    margin: { ARS: 64 },
    sales: { ARS: 1250 },
    purchases: { ARS: 450 },
    pending: { count: 0, amount: {} },
    purchaseDistribution: { ARS: [{ id: "fiscal", amount: 450, percentage: 100 }] },
    taxes: { retentions: [], perceptions: [] },
    topClients: [],
    topSuppliers: [],
    salesByClient: { ARS: [{ clientId: "client-a", name: "Client A", total: 1250, currency: "ARS" }] },
  }
}

function createTrend(): AnalyticsTrendEntry[] {
  return Array.from({ length: 12 }, (_, monthIndex): AnalyticsTrendEntry => ({
    month: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][monthIndex],
    monthIndex,
    cobros: monthIndex === 2 ? { ARS: 1250 } : {},
    pagos: monthIndex === 2 ? { ARS: 450 } : {},
    balance: monthIndex === 2 ? { ARS: 800 } : {},
    margin: monthIndex === 2 ? { ARS: 64 } : {},
    variation: monthIndex === 2 ? { ARS: { absolute: 250, percentage: 25 } } : {},
    paymentsVariation: monthIndex === 2 ? { ARS: { absolute: 50, percentage: 12.5 } } : {},
    balanceVariation: monthIndex === 2 ? { ARS: { absolute: 200, percentage: 33.33 } } : {},
  }))
}

describe("Analytics presentation components", () => {
  it("renders dynamic currency controls and cash summary values", () => {
    render(
      <>
        <AnalyticsHeader currency="ARS" availableCurrencies={["ARS", "USD"]} onCurrencyChange={jest.fn()} />
        <AnalyticsSummaryCards
          currency="ARS"
          periodLabel="Acumulado del año"
          collections={1250}
          payments={450}
          balance={800}
          margin={64}
          collectionsVariation={{ absolute: 250, percentage: 25 }}
          paymentsVariation={{ absolute: -50, percentage: -10 }}
          balanceVariation={{ absolute: 300, percentage: 60 }}
        />
      </>
    )

    expect(screen.getByRole("button", { name: "USD" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "6 Meses" })).not.toBeInTheDocument()
    expect(screen.getByText(/1\.250,00/)).toBeInTheDocument()
    expect(screen.getByText(/450,00/)).toBeInTheDocument()
    expect(screen.getByText(/800,00/)).toBeInTheDocument()
    expect(screen.getByText("Margen 64.00%")).toBeInTheDocument()
  })

  it("selects the current currency data without duplicating currency-specific logic", () => {
    const data: AnalyticsData = {
      currentMonth: createPeriodMetrics(),
      annual: createPeriodMetrics(),
      trend: createTrend(),
      annualVariations: { collections: { ARS: { absolute: 250, percentage: 25 } }, payments: { ARS: { absolute: 50, percentage: 12.5 } }, balance: { ARS: { absolute: 200, percentage: 33.33 } } },
    }

    const { result } = renderHook(() => useAnalyticsChart(data, "ARS"))

    expect(result.current.collections).toBe(1250)
    expect(result.current.payments).toBe(450)
    expect(result.current.expenseCategories.map((category) => category.id)).toEqual(["fiscal"])
  })

  it("uses annual-to-date values and sales grouped by client", () => {
    const annual = createPeriodMetrics()
    annual.collections = { ARS: 3000 }
    annual.salesByClient = { ARS: [{ clientId: "client-a", name: "Client A", total: 3000, currency: "ARS" }] }
    const data: AnalyticsData = {
      currentMonth: createPeriodMetrics(),
      annual,
      trend: createTrend(),
      annualVariations: { collections: { ARS: { absolute: 1000, percentage: 50 } }, payments: { ARS: { absolute: 50, percentage: 12.5 } }, balance: { ARS: { absolute: 950, percentage: 60 } } },
    }

    const { result } = renderHook(() => useAnalyticsChart(data, "ARS"))

    expect(result.current.collections).toBe(3000)
    expect(result.current.salesByClient).toEqual(annual.salesByClient.ARS)
  })

  it("renders purchase distribution as a donut and paginates client sales", () => {
    render(<AnalyticsExpenseDistribution currency="ARS" categories={[{ id: "fiscal", amount: 100, percentage: 100, category: "Compras fiscales", color: "#FF5C00" }]} />)
    expect(screen.getByTestId("analytics-purchase-donut")).toBeInTheDocument()

    const clients = Array.from({ length: 11 }, (_, index) => ({ clientId: `client-${index}`, name: `Client ${index}`, total: 100 - index, currency: "ARS" }))
    render(<AnalyticsSalesByClient currency="ARS" clients={clients} />)
    expect(screen.getByText("Client 0")).toBeInTheDocument()
    expect(screen.queryByText("Client 10")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "2" }))
    expect(screen.getByText("Client 10")).toBeInTheDocument()
    expect(screen.queryByText("CUIT")).not.toBeInTheDocument()
  })
})
