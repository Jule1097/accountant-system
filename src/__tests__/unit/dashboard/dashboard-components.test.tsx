/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import { KpiCards } from "src/components/dashboard/kpi-cards"
import { RecentActivity } from "src/components/dashboard/recent-activity"

describe("dashboard components", () => {
  it("renders kpi cards with zero values when analytics data is unavailable", () => {
    render(<KpiCards data={undefined as never} />)

    expect(screen.getByText("Ingresos del mes")).toBeInTheDocument()
    expect(screen.getAllByText("$ 0,00")).toHaveLength(2)
  })

  it("renders recent activity empty states when dashboard activity data is unavailable", () => {
    render(<RecentActivity data={undefined as never} />)

    expect(screen.getByText("Ventas por Semana")).toBeInTheDocument()
    expect(screen.getByText("No hay compras registradas recientemente.")).toBeInTheDocument()
  })
})
