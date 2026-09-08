/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import { VoucherDetailModal } from "src/components/vouchers/voucher-detail-modal"
import type { VoucherApiResponse } from "src/types/voucher/voucher-api"

const useVoucherFormOptionsMock = jest.fn()
const voucherModalReadyMock = jest.fn(({ options }: { options: unknown }) => <div data-testid="voucher-modal-ready">{JSON.stringify(options)}</div>)

jest.mock("src/hooks/voucher/use-voucher-form-options", () => ({
  useVoucherFormOptions: (...args: unknown[]) => useVoucherFormOptionsMock(...args),
}))

jest.mock("src/components/vouchers/voucher-modal", () => ({
  VoucherModalLoading: () => <div data-testid="voucher-modal-loading" />,
  VoucherModalReady: (props: { options: unknown }) => voucherModalReadyMock(props),
}))

function createVoucher(): VoucherApiResponse {
  return {
    id: "voucher-1",
    companyId: "company-1",
    type: "purchase",
    voucherTypeId: "voucher-type-1",
    voucherType: { name: "Factura" },
    voucherLetterId: "voucher-letter-1",
    voucherLetter: { letter: "A" },
    posNumber: "00001",
    number: "00000001",
    date: "2026-08-08",
    accountingPeriod: "2026-08-01",
    currency: "$",
    exchangeRate: "1",
    subtotal: "100",
    vatAmount: "21",
    nonTaxableAmount: "0",
    exemptAmount: "0",
    otherTaxesAmount: "0",
    totalAmount: "121",
    netAmount: "121",
    saldo: "121",
    paidAmount: "0",
    paymentMethod: "Transferencia",
    paymentDate: null,
    status: "pending",
    concept: "Servicio",
    comments: null,
    createdByUserId: "user-1",
    clientId: null,
    supplierId: "supplier-1",
    client: null,
    supplier: { name: "Proveedor Uno", cuit: "30-11111111-9" },
    retentions: [],
    perceptions: [{ perceptionConceptId: "perception-1", taxJurisdictionId: "jurisdiction-1", amount: "21", conceptName: "Percepción IVA", taxJurisdictionName: "Nacional" }],
    vatDetails: [],
  }
}

describe("VoucherDetailModal", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useVoucherFormOptionsMock.mockReturnValue({ promise: null })
  })

  it("does not request form options in view mode and renders local detail options", () => {
    render(
      <VoucherDetailModal
        voucherId="voucher-1"
        voucher={createVoucher()}
        error={undefined}
        isLoading={false}
        type="purchases"
        mode="view"
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
        onLoadError={jest.fn()}
      />
    )

    expect(useVoucherFormOptionsMock).toHaveBeenCalledWith({ isOpen: false, type: "purchases" })
    expect(screen.getByTestId("voucher-modal-ready")).toHaveTextContent("Proveedor Uno")
    expect(screen.getByTestId("voucher-modal-ready")).toHaveTextContent("Percepción IVA")
  })
})
