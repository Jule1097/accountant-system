/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { useNotifications } from "src/hooks/shared/use-notifications"
import type { CompanyNotificationRecord } from "src/types/notification/notification"

const mockApiRequest = jest.fn()
const mockMutate = jest.fn()
const mockPush = jest.fn()
const mockUseSWR = jest.fn()
const mockUseCompany = jest.fn()

jest.mock("src/lib/api/api-client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("swr", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock("src/contexts/company-context", () => ({
  useCompany: () => mockUseCompany(),
}))

describe("useNotifications", () => {
  const notification: CompanyNotificationRecord = {
    id: "notification-1",
    companyId: "company-1",
    category: "parser-batch-completed",
    title: "Comprobantes procesados",
    message: "Ya se terminaron de procesar los comprobantes.",
    targetPath: "/conciliations?batchId=batch-1&tab=sales&page=1",
    sourceId: "batch-1",
    createdAt: "2026-09-24T12:00:00.000Z",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCompany.mockReturnValue({ activeCompanyId: "company-1", loading: false })
    mockUseSWR.mockReturnValue({
      data: { notifications: [notification], hasActiveParserBatch: false },
      isLoading: false,
      mutate: mockMutate,
    })
    mockApiRequest.mockResolvedValue({ ok: true })
  })

  it("deletes the notification before navigating to its target", async () => {
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await result.current.handleOpenNotification(notification)
    })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/notifications/notification-1", {
      method: "DELETE",
      headers: { "x-company-id": "company-1" },
    })
    expect(mockMutate).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith(notification.targetPath)
    expect(mockApiRequest.mock.invocationCallOrder[0]).toBeLessThan(mockPush.mock.invocationCallOrder[0])
  })
})
