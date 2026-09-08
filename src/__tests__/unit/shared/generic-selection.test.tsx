/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { useAccumulatedSelection } from "src/hooks/shared/use-accumulated-selection"

describe("generic accumulated selection", () => {
  it("accumulates string and numeric IDs across pages", () => {
    const { result } = renderHook(() => useAccumulatedSelection<string | number>({ companyId: "company-1" }))

    act(() => result.current.toggle("one", true))
    act(() => result.current.toggle(2, true))

    expect(result.current.selectedIds).toEqual(["one", 2])
  })

  it("clears selection when company context changes", () => {
    const { result, rerender } = renderHook(
      ({ companyId }: { companyId: string | null }) => useAccumulatedSelection<string>({ companyId }),
      { initialProps: { companyId: "company-1" } }
    )

    act(() => result.current.toggle("one", true))
    rerender({ companyId: "company-2" })

    expect(result.current.selectedIds).toEqual([])
  })
})
