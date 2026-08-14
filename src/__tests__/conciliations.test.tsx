/** @jest-environment jsdom */

import { fireEvent, render, screen, act } from "@testing-library/react";
import { LoginForm } from "src/components/auth/login-form";
import ConciliationsPage from "src/app/(dashboard)/conciliations/page";

const toastAddMock = jest.fn();
const pushMock = jest.fn();
let currentSearchParamValue = "";

const searchParamsMock = {
  get: (key: string) => new URLSearchParams(currentSearchParamValue).get(key),
  toString: () => currentSearchParamValue,
};

jest.mock("next/navigation", () => ({
  usePathname: () => "/conciliations",
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsMock,
}));

jest.mock("src/components/ui/toast", () => ({
  useToastManager: () => ({ add: toastAddMock }),
}));

jest.mock("src/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { email: "test@example.com" },
    logout: jest.fn(),
    login: jest.fn(),
  }),
}));

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => ({
    companies: [{ id: "1", name: "Company 1" }],
    activeCompany: { id: "1", name: "Company 1" },
    activeCompanyId: "1",
    setActiveCompanyId: jest.fn(),
  }),
}));

describe("Login Theme & Conciliations UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentSearchParamValue = "";
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("applies light and dark responsive CSS theme classes on the Login Card", () => {
    render(<LoginForm />);
    const card = screen.getByText("Iniciar Sesión").closest('[data-slot="card"]');
    expect(card).toHaveClass("!bg-white");
    expect(card).toHaveClass("dark:!bg-zinc-950");
    expect(card).toHaveClass("border-zinc-200");
    expect(card).toHaveClass("dark:border-zinc-800");
  });

  it("renders only sales vouchers when tab is sales", () => {
    currentSearchParamValue = "?tab=sales";
    render(<ConciliationsPage />);
    expect(screen.getByText("Ventas")).toHaveClass("text-[#FF5C00]");
    expect(screen.getAllByText("Acme Corp S.A.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Movistar Argentina")).not.toBeInTheDocument();
  });

  it("renders only purchases vouchers when tab is purchases", () => {
    currentSearchParamValue = "?tab=purchases";
    render(<ConciliationsPage />);
    expect(screen.getByText("Compras")).toHaveClass("text-[#FF5C00]");
    expect(screen.getAllByText("Movistar Argentina").length).toBeGreaterThan(0);
    expect(screen.queryByText("Acme Corp S.A.")).not.toBeInTheDocument();
  });

  it("syncs tab selection with URL search parameters on click", () => {
    currentSearchParamValue = "?tab=sales";
    render(<ConciliationsPage />);
    const purchasesTab = screen.getByRole("button", { name: "Compras" });
    fireEvent.click(purchasesTab);
    expect(pushMock).toHaveBeenCalledWith("/conciliations?tab=purchases&page=1", { scroll: false });
  });

  it("simulates review toast on clicking Revisar button", () => {
    currentSearchParamValue = "?tab=sales";
    render(<ConciliationsPage />);
    const reviewBtn = screen.getAllByRole("button", { name: "Revisar" })[0];
    fireEvent.click(reviewBtn);
    expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
      type: "success",
      title: "Revisión iniciada",
    }));
  });

  it("shows loading indicator and updates toast on Regenerar click", () => {
    currentSearchParamValue = "?tab=sales";
    render(<ConciliationsPage />);
    const regenerateBtn = screen.getAllByRole("button", { name: "Regenerar" })[0];
    fireEvent.click(regenerateBtn);
    expect(screen.getByText("Regenerando...")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
      type: "success",
      title: "Regeneración completada",
    }));
  });

  it("excludes repeated/duplicate vouchers when clicking Eliminar button", () => {
    currentSearchParamValue = "?tab=sales";
    render(<ConciliationsPage />);
    expect(screen.getAllByText("Acme Corp S.A.").length).toBe(2);

    const deleteBtn = screen.getAllByRole("button", { name: "Eliminar" })[0];
    fireEvent.click(deleteBtn);

    expect(screen.getAllByText("Acme Corp S.A.").length).toBe(1);
    expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
      type: "success",
      title: "Comprobante eliminado",
    }));
  });

  it("syncs page queries when navigating pagination controls", () => {
    currentSearchParamValue = "?tab=sales&page=1";
    render(<ConciliationsPage />);
    const pageTwoBtn = screen.getByRole("button", { name: "2" });
    fireEvent.click(pageTwoBtn);
    expect(pushMock).toHaveBeenCalledWith("/conciliations?tab=sales&page=2", { scroll: false });
  });
});
