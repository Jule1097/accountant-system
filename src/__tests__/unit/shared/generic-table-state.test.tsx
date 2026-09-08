/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { useTableQueryState } from "src/hooks/shared/use-table-query-state"

const replaceMock = jest.fn()
let searchParamsValue = "page=4&foreign=keep"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}))

describe("generic table query state", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    searchParamsValue = "page=4&foreign=keep"
    replaceMock.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("debounces search and resets the owned page", () => {
    const { result } = renderHook(() => useTableQueryState({
      pathname: "/vouchers",
      parameters: {
        page: { defaultValue: 1 },
        search: { defaultValue: "" },
      },
      searchKey: "search",
      pageKey: "page",
      debounceMs: 300,
    }))

    act(() => result.current.setSearch("acme"))
    act(() => jest.advanceTimersByTime(299))
    expect(replaceMock).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(1))
    expect(replaceMock).toHaveBeenCalledWith("/vouchers?page=1&foreign=keep&search=acme", { scroll: false })
  })

  it("normalizes pagination and allows only configured sort values", () => {
    searchParamsValue = "page=0&sort=unsupported&foreign=keep"
    const { result } = renderHook(() => useTableQueryState({
      pathname: "/vouchers",
      parameters: {
        page: { defaultValue: 1, parse: (value: string | null) => Number(value), normalize: (value: number) => Number.isInteger(value) && value > 0 ? value : 1 },
        sort: { defaultValue: "date", allowedValues: ["date", "status"] as const },
      },
      pageKey: "page",
      sortKey: "sort",
    }))

    expect(result.current.query).toEqual({ page: 1, sort: "date" })
    act(() => result.current.setSort("status"))
    expect(replaceMock).toHaveBeenCalledWith("/vouchers?page=1&sort=status&foreign=keep", { scroll: false })
  })

  it("clamps an out-of-range page when metadata is available", () => {
    searchParamsValue = "page=8"
    const { result } = renderHook(() => useTableQueryState({
      pathname: "/vouchers",
      parameters: { page: { defaultValue: 1, parse: (value: string | null) => Number(value), normalize: (value: number) => Number.isInteger(value) && value > 0 ? value : 1 } },
      pageKey: "page",
      totalPages: 3,
    }))

    expect(result.current.query.page).toBe(3)
    expect(replaceMock).toHaveBeenCalledWith("/vouchers?page=3", { scroll: false })
  })
})
