/** @jest-environment jsdom */

import { renderHook } from "@testing-library/react"
import { useAnalytics } from "src/hooks/analytics/use-analytics"
import { useNotifications } from "src/hooks/shared/use-notifications"
import { useClientsSuppliers } from "src/hooks/third-party/use-third-parties"
import { useVouchers } from "src/hooks/voucher/use-vouchers"

const useSWRMock = jest.fn()
const useCompanyMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock("swr", () => ({
  __esModule: true,
  default: function useSWR(...args: unknown[]) {
    return useSWRMock(...args)
  },
}))

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => useCompanyMock(),
}))

describe("company-scoped hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    })
  })

  it("keeps analytics requests disabled while the company context is still loading", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: true,
    })

    renderHook(() => useAnalytics())

    expect(useSWRMock).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        suspense: true,
      })
    )
  })

  it("keeps voucher collection requests disabled while the company context is still loading", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: true,
    })

    renderHook(() =>
      useVouchers("sale", {
        page: 1,
        pageSize: 10,
        sortBy: "date",
        sortOrder: "desc",
        voucherId: null,
      })
    )

    expect(useSWRMock).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        keepPreviousData: true,
        revalidateOnFocus: false,
      })
    )
  })

  it("keeps client-supplier collection requests disabled while the company context is still loading", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: true,
    })

    renderHook(() =>
      useClientsSuppliers("clients", {
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortOrder: "asc",
        recordId: null,
      })
    )

    expect(useSWRMock).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      })
    )

    expect(useSWRMock.mock.calls[0][2]).not.toHaveProperty("suspense")
  })

  it("disables focus revalidation for analytics route data", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: false,
    })

    renderHook(() => useAnalytics())

    expect(useSWRMock).toHaveBeenCalledWith(
      ["company-1", "/api/analytics"],
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        suspense: true,
      })
    )
  })

  it("does not expose cached resource revalidation as initial loading", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: false,
    })
    useSWRMock.mockReturnValue({
      data: { items: [{ id: "client-1" }] },
      error: undefined,
      isLoading: false,
      isValidating: true,
      mutate: jest.fn(),
    })

    const { result } = renderHook(() => useClientsSuppliers("clients", {
      page: 1,
      pageSize: 10,
      sortBy: "name",
      sortOrder: "asc",
      recordId: null,
    }))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isValidating).toBe(true)
  })

  it("keeps notifications requests disabled while the company context is still loading", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: true,
    })

    renderHook(() => useNotifications())

    expect(useSWRMock).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: expect.any(Function),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        refreshWhenHidden: false,
      })
    )

    const options = useSWRMock.mock.calls[0][2] as { refreshInterval: (value: unknown) => number }
    expect(options.refreshInterval(undefined)).toBe(0)
  })

  it("polls notifications every 30 seconds only while parser activity remains active", () => {
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: false,
    })

    useSWRMock.mockReturnValue({
      data: {
        notifications: [],
        hasActiveParserBatch: true,
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    })

    renderHook(() => useNotifications())

    expect(useSWRMock).toHaveBeenCalledWith(
      ["company-1", "/api/notifications"],
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: expect.any(Function),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        refreshWhenHidden: false,
      })
    )

    const options = useSWRMock.mock.calls[0][2] as {
      refreshInterval: (value: { hasActiveParserBatch: boolean } | undefined) => number
    }
    expect(options.refreshInterval({ hasActiveParserBatch: true })).toBe(30000)
    expect(options.refreshInterval({ hasActiveParserBatch: false })).toBe(0)
  })
})
