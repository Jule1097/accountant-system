/** @jest-environment jsdom */

import { act, render, screen, waitFor } from "@testing-library/react"
import { ReactNode } from "react"
import { SWRConfig } from "swr"
import { AuthProvider } from "src/contexts/auth-context"
import { CompanyProvider, useCompany } from "src/contexts/company-context"
import { useAuth } from "src/hooks/auth/use-auth"
import { apiRequest } from "src/lib/api/api-client"

const getUserMock = jest.fn()
const onAuthStateChangeMock = jest.fn()
const apiRequestMock = apiRequest as jest.MockedFunction<typeof apiRequest>

jest.mock("src/lib/api/api-client", () => ({
  apiRequest: jest.fn(),
}))

jest.mock("src/lib/integrations/supabase-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: (...args: unknown[]) => getUserMock(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
    },
  }),
}))

function TestProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AuthProvider>
        <CompanyProvider>{children}</CompanyProvider>
      </AuthProvider>
    </SWRConfig>
  )
}

function AuthConsumer({ label }: { label: string }) {
  const { user, loading } = useAuth()

  return (
    <div data-testid={label}>
      {loading ? "loading" : `${user?.id ?? "none"}|${user?.email ?? "none"}`}
    </div>
  )
}

function CompanyConsumer() {
  const { companies, activeCompanyId, loading, setActiveCompanyId } = useCompany()

  return (
    <div>
      <div data-testid="company-loading">{loading ? "loading" : "ready"}</div>
      <div data-testid="company-count">{companies.length}</div>
      <div data-testid="active-company">{activeCompanyId ?? "none"}</div>
      <button type="button" onClick={() => setActiveCompanyId("company-2")}>
        Cambiar empresa
      </button>
    </div>
  )
}

describe("auth and company shared contexts", () => {
  beforeEach(() => {
    getUserMock.mockReset()
    onAuthStateChangeMock.mockReset()
    apiRequestMock.mockReset()
    window.localStorage.clear()

    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
          aud: "authenticated",
          role: "authenticated",
        },
      },
    })

    onAuthStateChangeMock.mockImplementation((callback: (event: string, session: { user: unknown } | null) => void) => {
      void callback
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }
    })

    apiRequestMock.mockResolvedValue({
      json: async () => [
        { id: "company-1", name: "Empresa 1", cuit: "20111111112" },
        { id: "company-2", name: "Empresa 2", cuit: "20222222223" },
      ],
    } as Response)
  })

  it("shares one authenticated-user lookup across multiple consumers and exposes only the DTO fields", async () => {
    render(
      <TestProviders>
        <AuthConsumer label="first" />
        <AuthConsumer label="second" />
      </TestProviders>
    )

    await waitFor(() => {
      expect(screen.getByTestId("first")).toHaveTextContent("user-1|user@example.com")
    })

    expect(screen.getByTestId("second")).toHaveTextContent("user-1|user@example.com")
    expect(getUserMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("first")).not.toHaveTextContent("authenticated")
  })

  it("does not expose raw session data through the login contract", async () => {
    apiRequestMock.mockImplementation(async (path: string) => {
      if (path === "/api/auth/login") {
        return {
          json: async () => ({
            user: {
              id: "user-2",
              email: "updated@example.com",
            },
          }),
        } as Response
      }

      return {
        json: async () => [
          { id: "company-1", name: "Empresa 1", cuit: "20111111112" },
          { id: "company-2", name: "Empresa 2", cuit: "20222222223" },
        ],
      } as Response
    })

    let loginResult: unknown

    function LoginConsumer() {
      const { login, user } = useAuth()

      return (
        <div>
          <div data-testid="login-user">{user?.id ?? "none"}|{user?.email ?? "none"}</div>
          <button
            type="button"
            onClick={async () => {
              loginResult = await login("user@example.com", "password")
            }}
          >
            Login
          </button>
        </div>
      )
    }

    render(
      <TestProviders>
        <LoginConsumer />
      </TestProviders>
    )

    await waitFor(() => {
      expect(screen.getByTestId("login-user")).toHaveTextContent("user-1|user@example.com")
    })

    await act(async () => {
      screen.getByRole("button", { name: "Login" }).click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("login-user")).toHaveTextContent("user-2|updated@example.com")
    })

    expect(loginResult).toBeUndefined()
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password",
      }),
    })
  })

  it("loads companies once, keeps the list shared, and persists the active company selection", async () => {
    window.localStorage.setItem("active_company_id", "company-1")

    render(
      <TestProviders>
        <CompanyConsumer />
        <CompanyConsumer />
      </TestProviders>
    )

    await waitFor(() => {
      expect(screen.getAllByTestId("company-loading")[0]).toHaveTextContent("ready")
    })

    expect(apiRequestMock).toHaveBeenCalledTimes(1)
    expect(screen.getAllByTestId("company-count")[0]).toHaveTextContent("2")
    expect(screen.getAllByTestId("active-company")[0]).toHaveTextContent("company-1")

    await act(async () => {
      screen.getAllByRole("button", { name: "Cambiar empresa" })[0].click()
    })

    expect(window.localStorage.getItem("active_company_id")).toBe("company-2")
    expect(screen.getAllByTestId("active-company")[0]).toHaveTextContent("company-2")
    expect(screen.getAllByTestId("active-company")[1]).toHaveTextContent("company-2")
  })

  it("fetches companies on the first dashboard mount and reuses the shared cache on remount", async () => {
    const cache = new Map()

    function DashboardCompanyTree({ isMounted }: { isMounted: boolean }) {
      return (
        <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>
          <AuthProvider>{isMounted ? <CompanyProvider><CompanyConsumer /></CompanyProvider> : null}</AuthProvider>
        </SWRConfig>
      )
    }

    const { rerender } = render(<DashboardCompanyTree isMounted />)

    await waitFor(() => {
      expect(screen.getByTestId("company-loading")).toHaveTextContent("ready")
    })

    expect(apiRequestMock).toHaveBeenCalledTimes(1)
    expect(apiRequestMock).toHaveBeenCalledWith("/api/companies")

    rerender(<DashboardCompanyTree isMounted={false} />)
    rerender(<DashboardCompanyTree isMounted />)

    await waitFor(() => {
      expect(screen.getByTestId("company-loading")).toHaveTextContent("ready")
    })

    expect(apiRequestMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("company-count")).toHaveTextContent("2")
  })
})
