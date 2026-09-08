/** @jest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react"
import { useClientsSuppliersManagement } from "src/hooks/third-party/use-third-party-management"

const pushMock = jest.fn()
const replaceMock = jest.fn()
const useClientsSuppliersMock = jest.fn()
const useClientSupplierByIdMock = jest.fn()
const useCompanyMock = jest.fn()
const replaceStateMock = jest.fn()

const searchParamsState = {
  value: "page=2&pageSize=10&recordId=client-1&search=acme",
}

jest.mock("next/navigation", () => ({
  usePathname: () => "/clients",
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsState.value),
}))

jest.mock("src/components/ui/toast", () => ({
  useToastManager: () => ({
    add: jest.fn(),
  }),
}))

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => useCompanyMock(),
}))

jest.mock("src/hooks/third-party/use-third-parties", () => ({
  useClientsSuppliers: (...args: unknown[]) => useClientsSuppliersMock(...args),
  useClientSupplierById: (...args: unknown[]) => useClientSupplierByIdMock(...args),
}))

describe("useClientsSuppliersManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    replaceStateMock.mockReset()
    replaceMock.mockReset()
    window.history.replaceState = replaceStateMock
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: false,
    })
    useClientsSuppliersMock.mockReturnValue({ data: { items: [] }, isLoading: false, mutate: jest.fn() })
    useClientSupplierByIdMock.mockReturnValue({ data: undefined, isLoading: false, error: undefined, mutate: jest.fn() })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("drops the stale record detail query immediately when the active company changes", async () => {
    const { rerender } = renderHook(() => useClientsSuppliersManagement("clients"))

    expect(useClientSupplierByIdMock).toHaveBeenLastCalledWith("clients", "client-1")

    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-2",
      loading: false,
    })

    rerender()

    expect(useClientsSuppliersMock).toHaveBeenLastCalledWith("clients", {
      page: 1,
      pageSize: 10,
      sortBy: "name",
      sortOrder: "asc",
      recordId: null,
    })
    expect(useClientSupplierByIdMock).toHaveBeenLastCalledWith("clients", "")

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/clients", { scroll: false })
    })
  })

  it("does not reapply a pending search after clearing filters", () => {
    searchParamsState.value = "page=1&pageSize=10&search=afianzad"

    const { result } = renderHook(() => useClientsSuppliersManagement("clients"))

    act(() => {
      result.current.handleSearchChange("afianzadora")
      result.current.handleClearFilters()
      jest.advanceTimersByTime(1000)
    })

    expect(replaceMock).toHaveBeenCalledWith("/clients", { scroll: false })
    expect(replaceStateMock).not.toHaveBeenCalledWith(
      null,
      "",
      "/clients?page=1&pageSize=10&search=afianzadora"
    )
  })

  it("does not include recordId in the table query when only a detail modal is open", () => {
    searchParamsState.value = "page=2&pageSize=10&recordId=client-1&search=acme"

    renderHook(() => useClientsSuppliersManagement("clients"))

    expect(useClientsSuppliersMock).toHaveBeenCalledWith("clients", {
      page: 2,
      pageSize: 10,
      search: "acme",
      sortBy: "name",
      sortOrder: "asc",
      recordId: null,
    })
    expect(useClientSupplierByIdMock).toHaveBeenCalledWith("clients", "client-1")
  })

  it("opening the create modal does not activate record detail fetching or change table queries", () => {
    searchParamsState.value = "page=2&pageSize=10&search=acme"

    const { result } = renderHook(() => useClientsSuppliersManagement("clients"))

    expect(useClientsSuppliersMock).toHaveBeenLastCalledWith("clients", {
      page: 2,
      pageSize: 10,
      search: "acme",
      sortBy: "name",
      sortOrder: "asc",
      recordId: null,
    })
    expect(useClientSupplierByIdMock).toHaveBeenLastCalledWith("clients", "")

    act(() => {
      result.current.openCreateModal()
    })

    expect(useClientsSuppliersMock).toHaveBeenLastCalledWith("clients", {
      page: 2,
      pageSize: 10,
      search: "acme",
      sortBy: "name",
      sortOrder: "asc",
      recordId: null,
    })
    expect(useClientSupplierByIdMock).toHaveBeenLastCalledWith("clients", "")
  })

})
