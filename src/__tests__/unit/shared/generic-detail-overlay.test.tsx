/** @jest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react"
import { useConditionalDetail } from "src/hooks/shared/use-conditional-detail"

describe("conditional detail state", () => {
  it("uses the current record in detail mode without fetching", () => {
    const fetchById = jest.fn()
    const record = { id: "1", complete: true }
    const { result } = renderHook(() => useConditionalDetail({ mode: "detail", id: "1", currentRecord: record, fetchById }))

    expect(result.current.record).toBe(record)
    expect(fetchById).not.toHaveBeenCalled()
  })

  it("does not fetch when detail mode has no current record", () => {
    const fetchById = jest.fn()
    const { result } = renderHook(() => useConditionalDetail({ mode: "detail", id: "1", currentRecord: undefined, fetchById }))

    expect(result.current.state).toBe("unavailable")
    expect(fetchById).not.toHaveBeenCalled()
  })

  it("loads uncached edit data once and reuses cached data", async () => {
    const record = { id: "1", complete: true }
    const fetchById = jest.fn().mockResolvedValue(record)
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useConditionalDetail({ mode: "edit", id: "1", open, fetchById }),
      { initialProps: { open: true } }
    )

    await waitFor(() => expect(result.current.state).toBe("ready"))
    expect(fetchById).toHaveBeenCalledTimes(1)
    expect(result.current.record).toEqual(record)

    rerender({ open: false })
    rerender({ open: true })
    expect(fetchById).toHaveBeenCalledTimes(1)
  })
})
