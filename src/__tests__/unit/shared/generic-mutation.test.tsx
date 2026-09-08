/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { useAsyncMutation } from "src/hooks/shared/use-async-mutation"

describe("generic async mutation", () => {
  it("reports loading, success, error, and reset states", async () => {
    const { result } = renderHook(() => useAsyncMutation())
    const operation = jest.fn().mockResolvedValue("ok")

    let promise: Promise<string>
    act(() => {
      promise = result.current.execute(operation)
    })

    expect(result.current.status).toBe("loading")
    await act(async () => expect(await promise).toBe("ok"))
    expect(result.current.status).toBe("success")

    act(() => result.current.reset())
    expect(result.current.status).toBe("idle")
  })

  it("invalidates only configured resources after success", async () => {
    const invalidate = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAsyncMutation({ onSuccess: invalidate }))

    await act(async () => {
      await result.current.execute(async () => undefined)
    })

    expect(invalidate).toHaveBeenCalledTimes(1)
  })

  it("does not invalidate resources after failure", async () => {
    const invalidate = jest.fn()
    const { result } = renderHook(() => useAsyncMutation({ onSuccess: invalidate }))

    await act(async () => {
      await expect(result.current.execute(async () => { throw new Error("failed") })).rejects.toThrow("failed")
    })
    expect(invalidate).not.toHaveBeenCalled()
    expect(result.current.status).toBe("error")
  })
})
