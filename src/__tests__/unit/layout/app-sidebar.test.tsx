/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import { AppSidebar } from "src/components/layout/app-sidebar"

const useAuthMock = jest.fn()
const useCompanyMock = jest.fn()

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock("src/hooks/auth/use-auth", () => ({
  useAuth: () => useAuthMock(),
}))

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => useCompanyMock(),
}))

jest.mock("src/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, render }: { children?: React.ReactNode; render?: React.ReactNode }) => (
    <button type="button">{render ?? children}</button>
  ),
}))

jest.mock("src/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ render }: { render: React.ReactNode }) => <>{render}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("AppSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthMock.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
      loading: false,
      logout: jest.fn(),
    })
    useCompanyMock.mockReturnValue({
      companies: [{ id: "company-1", name: "Acme SA", cuit: "20123456789" }],
      activeCompany: { id: "company-1", name: "Acme SA", cuit: "20123456789" },
      activeCompanyId: "company-1",
      setActiveCompanyId: jest.fn(),
      loading: false,
    })
  })

  it("shows the authenticated email and active company once shared state is ready", () => {
    render(<AppSidebar />)

    expect(screen.getByText("user@example.com")).toBeInTheDocument()
    expect(screen.getByText("Acme SA")).toBeInTheDocument()
  })

  it("shows skeleton placeholders instead of fallback text while auth or company state is still loading", () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: true,
      logout: jest.fn(),
    })
    useCompanyMock.mockReturnValue({
      companies: [],
      activeCompany: null,
      activeCompanyId: null,
      setActiveCompanyId: jest.fn(),
      loading: true,
    })

    const { container } = render(<AppSidebar />)

    expect(screen.queryByText("Usuario")).not.toBeInTheDocument()
    expect(screen.queryByText("Sin empresa")).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })
})
