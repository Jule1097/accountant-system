/** @jest-environment jsdom */

import { render, renderHook, screen } from "@testing-library/react";
import { AnalyticsHeader } from "src/components/analytics/analytics-header";
import { AnalyticsSummaryCards } from "src/components/analytics/analytics-summary-cards";
import { useAnalyticsChart } from "src/hooks/analytics/use-analytics-chart";
import type { AnalyticsData } from "src/types/analytics/analytics";

describe("Analytics presentation components", () => {
  it("renders analytics controls and summary values from prepared props", () => {
    render(
      <>
        <AnalyticsHeader
          currency="ARS"
          period="6_months"
          onCurrencyChange={jest.fn()}
          onPeriodChange={jest.fn()}
        />
        <AnalyticsSummaryCards
          currency="ARS"
          salesValue={1250}
          totalExpenses={450}
          marginPercentage="64.0"
        />
      </>
    );

    expect(screen.getByRole("button", { name: "USD" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6 Meses" })).toBeInTheDocument();
    expect(screen.getByText(/1\.250,00/)).toBeInTheDocument();
    expect(screen.getByText(/450,00/)).toBeInTheDocument();
    expect(screen.getByText("64.0%")).toBeInTheDocument();
  });

  it("builds stable unique identifiers for expense categories", () => {
    const data: AnalyticsData = {
      monthly: {
        netSales: { ARS: 0, USD: 0 },
        netPurchases: { ARS: 1000, USD: 0 },
        salesCreditNotes: { ARS: 0, USD: 0 },
        purchasesCreditNotes: { ARS: 0, USD: 0 },
        vatDebit: { ARS: 0, USD: 0 },
        vatCredit: { ARS: 210, USD: 0 },
        vatNetBalance: { ARS: 0, USD: 0 },
        retentions: [],
        perceptions: [
          { concept: "Ingresos Brutos", province: "Buenos Aires", currency: "ARS", total: 50 },
          { concept: "Ingresos Brutos", province: "Córdoba", currency: "ARS", total: 25 },
        ],
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
      trend: { ARS: [], USD: [] },
    };

    const { result } = renderHook(() => useAnalyticsChart(data, "ARS", "6_months"));

    expect(result.current.expenseCategories.map((category) => category.id)).toEqual([
      "net-purchases",
      "vat-credit",
      "perception:Ingresos Brutos:Buenos Aires:ARS",
      "perception:Ingresos Brutos:Córdoba:ARS",
    ]);
    expect(new Set(result.current.expenseCategories.map((category) => category.id)).size).toBe(result.current.expenseCategories.length);
  });
});
