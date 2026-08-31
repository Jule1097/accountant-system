/** @jest-environment jsdom */

const dynamicMock = jest.fn<() => null, [unknown, unknown?]>(() => () => null)

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (loader: unknown, options?: unknown) => dynamicMock(loader, options),
}))

describe("dynamic overlay loading", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it("keeps voucher overlays isolated from the page suspense fallback", async () => {
    await import("src/components/vouchers/voucher-management-view")

    expect(dynamicMock).toHaveBeenCalledTimes(3)
    expect(dynamicMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      expect.objectContaining({
        ssr: false,
        loading: expect.any(Function),
      })
    )
    expect(dynamicMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      expect.objectContaining({
        ssr: false,
        loading: expect.any(Function),
      })
    )
    expect(dynamicMock).toHaveBeenNthCalledWith(
      3,
      expect.any(Function),
      expect.objectContaining({
        ssr: false,
        loading: expect.any(Function),
      })
    )
  })

  it("keeps client-supplier overlays isolated from the page suspense fallback", async () => {
    await import("src/components/clients-suppliers/clients-suppliers-management-view")

    expect(dynamicMock).toHaveBeenCalledTimes(3)
    expect(dynamicMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      expect.objectContaining({
        ssr: false,
        loading: expect.any(Function),
      })
    )
    expect(dynamicMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      expect.objectContaining({
        ssr: false,
        loading: expect.any(Function),
      })
    )
    expect(dynamicMock).toHaveBeenNthCalledWith(
      3,
      expect.any(Function),
      expect.objectContaining({
        ssr: false,
        loading: expect.any(Function),
      })
    )
  })
})
