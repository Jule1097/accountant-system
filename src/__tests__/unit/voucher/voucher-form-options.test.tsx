/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { useVoucherFormOptions } from "src/hooks/voucher/use-voucher-form-options"

const apiRequestMock = jest.fn()
const useCompanyMock = jest.fn()

jest.mock("src/lib/api/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  parseJsonResponse: async <T,>(response: Response) => response.json() as Promise<T>,
}))

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => useCompanyMock(),
}))

describe("useVoucherFormOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiRequestMock.mockImplementation((path: string) => Promise.resolve({
      json: async () => path === "/api/catalogs" ? { voucherTypes: [], voucherLetters: [], retentionConcepts: [], perceptionConcepts: [], taxJurisdictions: [] } : [],
    }))
    useCompanyMock.mockReturnValue({ activeCompanyId: "company-1", loading: false })
  })

  it.each(["purchases", "sales"] as const)("does not reuse %s third-party options between active companies", async (type) => {
    const { result, rerender } = renderHook(() => useVoucherFormOptions({ isOpen: true, type }))
    const firstPromise = result.current.promise

    useCompanyMock.mockReturnValue({ activeCompanyId: "company-2", loading: false })
    rerender()

    const secondPromise = result.current.promise

    expect(secondPromise).not.toBe(firstPromise)

    await act(async () => {
      await Promise.all([firstPromise, secondPromise])
    })

    const endpoint = type === "purchases" ? "/api/suppliers" : "/api/clients"
    expect(apiRequestMock.mock.calls.filter(([path]) => path === endpoint)).toHaveLength(2)
  })

  it("does not load options while the company context is resolving", () => {
    useCompanyMock.mockReturnValue({ activeCompanyId: "company-teem", loading: true })

    const { result } = renderHook(() => useVoucherFormOptions({ isOpen: true, type: "sales" }))

    expect(result.current.promise).toBeNull()
    expect(apiRequestMock).not.toHaveBeenCalled()
  })
})
