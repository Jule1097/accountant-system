/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import {
  useResourceDetail,
  useResourceList,
  useResourceMutation,
} from "src/hooks/shared/use-resource"

const swrMock = jest.fn()
const useCompanyMock = jest.fn()

jest.mock("swr", () => ({
  __esModule: true,
  default: (...args: unknown[]) => swrMock(...args),
}))

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => useCompanyMock(),
}))

describe("generic resource hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useCompanyMock.mockReturnValue({ activeCompanyId: "company-1", loading: false })
    swrMock.mockReturnValue({ data: undefined, error: undefined, isLoading: false, mutate: jest.fn() })
  })

  it("loads and maps a resource collection through an injected adapter", async () => {
    const adapter = {
      buildPath: jest.fn(() => "/api/resources?page=1"),
      fetch: jest.fn(async () => ({ records: [{ id: "1" }] })),
      mapResponse: jest.fn((response: { records: { id: string }[] }) => response.records),
    }

    renderHook(() => useResourceList({ query: { page: 1 }, adapter }))

    expect(swrMock).toHaveBeenCalledWith(
      ["company-1", "/api/resources?page=1"],
      expect.any(Function),
      expect.objectContaining({ keepPreviousData: true, revalidateOnFocus: false })
    )

    const fetcher = swrMock.mock.calls[0][1] as (key: readonly [string, string]) => Promise<unknown>
    await fetcher(["company-1", "/api/resources?page=1"])

    expect(adapter.fetch).toHaveBeenCalledWith("company-1", "/api/resources?page=1")
    expect(adapter.mapResponse).toHaveBeenCalledWith({ records: [{ id: "1" }] })
  })

  it("keeps detail requests disabled without a resource identifier", () => {
    const adapter = {
      buildPath: jest.fn(() => "/api/resources/1"),
      fetch: jest.fn(),
      mapResponse: jest.fn(),
    }

    renderHook(() => useResourceDetail({ resourceId: null, adapter }))

    expect(swrMock).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({ revalidateOnFocus: false })
    )
    expect(adapter.buildPath).not.toHaveBeenCalled()
  })

  it("executes only the mutation operation provided by the adapter", async () => {
    const adapter = {
      create: jest.fn(async (_companyId: string | null, payload: { name: string }) => ({ id: "1", ...payload })),
    }
    const { result } = renderHook(() => useResourceMutation({ adapter, scopeId: "company-1" }))

    await act(async () => {
      await result.current.create({ name: "Acme" })
    })

    expect(adapter.create).toHaveBeenCalledWith("company-1", { name: "Acme" })
  })

  it("exposes mutation loading state while an operation is pending", async () => {
    let resolveCreate: ((value: { id: string }) => void) | undefined
    const adapter = {
      create: jest.fn(() => new Promise<{ id: string }>((resolve) => {
        resolveCreate = resolve
      })),
    }
    const { result } = renderHook(() => useResourceMutation({ adapter, scopeId: "company-1" }))

    let createPromise: Promise<{ id: string }>
    act(() => {
      createPromise = result.current.create({ name: "Acme" })
    })

    expect(result.current.isMutating).toBe(true)

    await act(async () => {
      resolveCreate?.({ id: "1" })
      await createPromise
    })

    expect(result.current.isMutating).toBe(false)
  })

  it("rejects unsupported optional mutation operations", async () => {
    const adapter = {}
    const { result } = renderHook(() => useResourceMutation({ adapter }))

    await expect(result.current.update("resource-1", { name: "Acme" })).rejects.toThrow("Update operation is not available")
    await expect(result.current.remove("resource-1")).rejects.toThrow("Delete operation is not available")
  })

  it("updates the scoped collection key when the active company changes", () => {
    const adapter = {
      buildPath: jest.fn(() => "/api/resources"),
      fetch: jest.fn(),
      mapResponse: jest.fn(),
    }
    const { rerender } = renderHook(() => useResourceList({ query: { page: 1 }, adapter }))

    useCompanyMock.mockReturnValue({ activeCompanyId: "company-2", loading: false })
    rerender()

    expect(swrMock).toHaveBeenLastCalledWith(
      ["company-2", "/api/resources"],
      expect.any(Function),
      expect.objectContaining({ keepPreviousData: true, revalidateOnFocus: false })
    )
  })

})
