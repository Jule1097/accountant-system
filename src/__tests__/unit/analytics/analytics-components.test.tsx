/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { AnalyticsHeader } from "src/components/analytics/analytics-header";
import { AnalyticsSummaryCards } from "src/components/analytics/analytics-summary-cards";

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
});
