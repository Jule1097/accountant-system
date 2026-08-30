/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import { ReactNode } from "react"
import { AppProviders } from "src/components/providers/app-providers"
import { DashboardProviders } from "src/components/providers/dashboard-providers"

jest.mock("src/components/providers/swr-provider", () => ({
  SwrProvider: ({ children }: { children: ReactNode }) => <div data-testid="swr-provider">{children}</div>,
}))

jest.mock("src/contexts/auth-context", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <div data-testid="auth-provider">{children}</div>,
}))

jest.mock("src/contexts/company-context", () => ({
  CompanyProvider: ({ children }: { children: ReactNode }) => <div data-testid="company-provider">{children}</div>,
}))

jest.mock("src/components/ui/toast", () => ({
  Toaster: ({ children }: { children: ReactNode }) => <div data-testid="toaster">{children}</div>,
}))

jest.mock("src/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-provider">{children}</div>,
}))

describe("application providers", () => {
  it("keeps the root provider tree free of company data loading", () => {
    render(
      <AppProviders>
        <div>child</div>
      </AppProviders>
    )

    expect(screen.getByTestId("swr-provider")).toBeInTheDocument()
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument()
    expect(screen.getByTestId("tooltip-provider")).toBeInTheDocument()
    expect(screen.getByTestId("toaster")).toBeInTheDocument()
    expect(screen.queryByTestId("company-provider")).not.toBeInTheDocument()
  })

  it("mounts company data only inside dashboard routes", () => {
    render(
      <DashboardProviders>
        <div>child</div>
      </DashboardProviders>
    )

    expect(screen.getByTestId("company-provider")).toBeInTheDocument()
  })
})
