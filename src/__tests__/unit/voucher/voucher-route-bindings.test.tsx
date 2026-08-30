/** @jest-environment jsdom */

import { render } from "@testing-library/react"
import { PurchasesView } from "src/components/vouchers/purchases-view"
import { SalesView } from "src/components/vouchers/sales-view"

const voucherManagementViewMock = jest.fn()

jest.mock("src/components/vouchers/voucher-management-view", () => ({
  VoucherManagementView: (props: unknown) => {
    voucherManagementViewMock(props)
    return <div data-testid="voucher-management-view" />
  },
}))

describe("voucher route bindings", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("binds the sales route to the sale management scope only", () => {
    render(<SalesView />)

    expect(voucherManagementViewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "sales",
        title: "Ventas",
      })
    )
  })

  it("binds the purchases route to the purchase management scope only", () => {
    render(<PurchasesView />)

    expect(voucherManagementViewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "purchases",
        title: "Compras",
      })
    )
  })
})
