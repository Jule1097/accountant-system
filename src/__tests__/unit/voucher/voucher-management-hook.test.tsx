/** @jest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react"
import { useVoucherManagement } from "src/hooks/voucher/use-voucher-management"

const useVouchersMock = jest.fn()
const useVoucherSummaryMock = jest.fn()
const useVoucherByIdMock = jest.fn()
const useCompanyMock = jest.fn()
const replaceStateMock = jest.fn()

const searchParamsState = {
  value: "page=2&pageSize=10&voucherId=voucher-1&status=pending",
}

jest.mock("next/navigation", () => ({
  usePathname: () => "/sales",
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

jest.mock("src/hooks/voucher/use-vouchers", () => ({
  useVouchers: (...args: unknown[]) => useVouchersMock(...args),
  useVoucherSummary: (...args: unknown[]) => useVoucherSummaryMock(...args),
  useVoucherById: (...args: unknown[]) => useVoucherByIdMock(...args),
}))

describe("useVoucherManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    replaceStateMock.mockReset()
    window.history.replaceState = replaceStateMock
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: false,
    })
    useVouchersMock.mockReturnValue({ data: { items: [] }, isLoading: false, mutate: jest.fn() })
    useVoucherSummaryMock.mockReturnValue({ data: undefined, isLoading: false, mutate: jest.fn() })
    useVoucherByIdMock.mockReturnValue({ data: undefined, isLoading: false, error: undefined, mutate: jest.fn() })
  })

  it("drops the stale voucher detail query immediately when the active company changes", async () => {
    const { rerender } = renderHook(() => useVoucherManagement("sales"))

    expect(useVoucherByIdMock).toHaveBeenLastCalledWith("voucher-1")

    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-2",
      loading: false,
    })

    rerender()

    expect(useVouchersMock).toHaveBeenLastCalledWith("sale", {
      page: 1,
      pageSize: 10,
      sortBy: "date",
      sortOrder: "desc",
      voucherId: null,
    })
    expect(useVoucherSummaryMock).toHaveBeenLastCalledWith("sale", {
      page: 1,
      pageSize: 10,
      sortBy: "date",
      sortOrder: "desc",
      voucherId: null,
    })
    expect(useVoucherByIdMock).toHaveBeenLastCalledWith("")

    await waitFor(() => {
      expect(replaceStateMock).toHaveBeenCalledWith(null, "", "/sales")
    })
  })

  it("does not include voucherId in the table or summary query when only the detail modal is open", () => {
    searchParamsState.value = "page=2&pageSize=10&voucherId=voucher-1&status=pending"

    renderHook(() => useVoucherManagement("sales"))

    expect(useVouchersMock).toHaveBeenCalledWith("sale", {
      page: 2,
      pageSize: 10,
      status: "pending",
      sortBy: "date",
      sortOrder: "desc",
      voucherId: null,
    })
    expect(useVoucherSummaryMock).toHaveBeenCalledWith("sale", {
      page: 2,
      pageSize: 10,
      status: "pending",
      sortBy: "date",
      sortOrder: "desc",
      voucherId: null,
    })
    expect(useVoucherByIdMock).toHaveBeenCalledWith("voucher-1")
  })

  it("opening the create modal does not activate voucher detail fetching or change table queries", () => {
    searchParamsState.value = "page=2&pageSize=10&status=pending"

    const { result } = renderHook(() => useVoucherManagement("sales"))

    expect(useVouchersMock).toHaveBeenLastCalledWith("sale", {
      page: 2,
      pageSize: 10,
      status: "pending",
      sortBy: "date",
      sortOrder: "desc",
      voucherId: null,
    })
    expect(useVoucherSummaryMock).toHaveBeenLastCalledWith("sale", {
      page: 2,
      pageSize: 10,
      status: "pending",
      sortBy: "date",
      sortOrder: "desc",
      voucherId: null,
    })
    expect(useVoucherByIdMock).toHaveBeenLastCalledWith("")

    act(() => {
      result.current.openCreateModal()
    })

    expect(useVouchersMock).toHaveBeenLastCalledWith("sale", {
      page: 2,
      pageSize: 10,
      status: "pending",
      sortBy: "date",
      sortOrder: "desc",
      voucherId: null,
    })
    expect(useVoucherSummaryMock).toHaveBeenLastCalledWith("sale", {
      page: 2,
      pageSize: 10,
      status: "pending",
      sortBy: "date",
      sortOrder: "desc",
      voucherId: null,
    })
    expect(useVoucherByIdMock).toHaveBeenLastCalledWith("")
  })
})
