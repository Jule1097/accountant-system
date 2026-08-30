/** @jest-environment jsdom */

import { render } from "@testing-library/react"
import { ReactNode } from "react"
import { SwrProvider } from "src/components/providers/swr-provider"

const swrConfigMock = jest.fn()

jest.mock("swr", () => ({
  SWRConfig: ({ children, value }: { children: ReactNode; value: unknown }) => {
    swrConfigMock(value)
    return <>{children}</>
  },
}))

describe("SwrProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("disables focus and reconnect revalidation by default", () => {
    render(
      <SwrProvider>
        <div>child</div>
      </SwrProvider>
    )

    expect(swrConfigMock).toHaveBeenCalledWith(
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
        dedupingInterval: 300,
      })
    )
  })
})
