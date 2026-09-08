/** @jest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react"
import { useConciliations } from "src/hooks/conciliation/use-conciliations"

const pushMock = jest.fn()
const replaceMock = jest.fn()
const useSWRMock = jest.fn()
const useCompanyMock = jest.fn()
const replaceStateMock = jest.fn()
const pushStateMock = jest.fn()

const searchParamsState = {
  value: "",
}

jest.mock("next/navigation", () => ({
  usePathname: () => "/conciliations",
  useRouter: () => ({ push: pushMock, refresh: jest.fn(), replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsState.value),
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

jest.mock("src/components/ui/toast", () => ({
  useToastManager: () => ({
    add: jest.fn(),
  }),
}))

jest.mock("src/lib/api/api-client", () => ({
  apiRequest: jest.fn(),
}))

describe("useConciliations", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    replaceStateMock.mockReset()
    pushStateMock.mockReset()
    window.history.replaceState = replaceStateMock
    window.history.pushState = pushStateMock
    useCompanyMock.mockReturnValue({
      activeCompanyId: "company-1",
      loading: false,
    })
    useSWRMock.mockReturnValue({
      data: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        processingCount: 0,
        readyCount: 0,
        validatedCount: 0,
        startIndex: 0,
        sections: [],
      },
      isLoading: false,
      mutate: jest.fn(),
    })
  })

  it("does not normalize missing query params on initial load", async () => {
    searchParamsState.value = ""

    renderHook(() => useConciliations())

    await waitFor(() => {
      expect(replaceMock).not.toHaveBeenCalled()
    })
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("updates tab query state through router replacement", async () => {
    searchParamsState.value = "tab=sales&page=1"

    const { result } = renderHook(() => useConciliations())

    act(() => result.current.handleTabChange("purchases"))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/conciliations?tab=purchases&page=1", { scroll: false })
    })
  })

  it("requests only the active tab data and keeps the review fetch disabled while the modal is closed", () => {
    searchParamsState.value = "tab=purchases&page=2"

    renderHook(() => useConciliations())

    expect(useSWRMock).toHaveBeenNthCalledWith(
      1,
      ["company-1", "/api/conciliations?tab=purchases&page=2"],
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: expect.any(Function),
        revalidateOnFocus: false,
        refreshWhenHidden: false,
      })
    )
    expect(useSWRMock).toHaveBeenNthCalledWith(
      2,
      null,
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
      })
    )
  })

  it("activates the review item request only after opening the review modal", () => {
    searchParamsState.value = "tab=sales&page=1"

    const { result } = renderHook(() => useConciliations())

    expect(useSWRMock).toHaveBeenNthCalledWith(
      2,
      null,
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
      })
    )

    act(() => {
      result.current.handleReview({
        id: "item-1",
        batchId: "batch-1",
        type: "sales",
        documentId: "A 00001-00000001",
        date: "2026-08-28",
        thirdParty: "Acme",
        amount: 1000,
        currency: "ARS",
        status: "Lista",
        message: "Lista para revisión",
        canReview: true,
        canRetry: false,
        canDiscard: true,
      })
    })

    expect(useSWRMock).toHaveBeenLastCalledWith(
      ["company-1", "/api/vouchers/parse/items/item-1"],
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
      })
    )
    expect(result.current.isReviewModalOpen).toBe(true)
    expect(result.current.reviewSourceUrl).toBe("/api/conciliations/items/item-1/source?companyId=company-1")
  })
})
