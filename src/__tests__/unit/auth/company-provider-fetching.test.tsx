/** @jest-environment jsdom */

import { render } from "@testing-library/react"
import { ReactNode } from "react"
import { CompanyProvider } from "src/contexts/company-context"

const useSWRMock = jest.fn()
const useAuthMock = jest.fn()

jest.mock("swr", () => ({
  __esModule: true,
  default: function useSWR(...args: unknown[]) {
    return useSWRMock(...args)
  },
}))

jest.mock("src/hooks/auth/use-auth", () => ({
  useAuth: () => useAuthMock(),
}))

function Wrapper({ children }: { children: ReactNode }) {
  return <CompanyProvider>{children}</CompanyProvider>
}

describe("CompanyProvider fetching", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSWRMock.mockReturnValue({
      data: [],
      isLoading: false,
      mutate: jest.fn(),
    })
  })

  it("keeps company data session-scoped without focus or reconnect revalidation", () => {
    useAuthMock.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
      loading: false,
    })

    render(
      <Wrapper>
        <div>child</div>
      </Wrapper>
    )

    expect(useSWRMock).toHaveBeenCalledWith(
      ["companies", "user-1"],
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
      })
    )
  })
})
