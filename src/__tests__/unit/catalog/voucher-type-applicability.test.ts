import { filterVoucherTypesByApplicability } from "src/lib/helpers/catalog/voucher-type-applicability"
import { VoucherRepository } from "src/repositories/voucher/voucher.repository"
import { VoucherService } from "src/services/voucher/Voucher"
import { VoucherFactoryInput } from "src/types/voucher/domain"
import { voucherTypeNotApplicableMessage } from "src/lib/constants/voucher"

jest.mock("src/repositories/voucher/voucher.repository")

describe("Voucher type applicability", () => {
  const voucherTypes = [
    { id: "shared", name: "Factura", applicability: "both" as const },
    { id: "purchase", name: "Pago de impuesto", applicability: "purchase" as const },
    { id: "sale", name: "Nota de venta", applicability: "sale" as const },
  ]

  it("includes shared and purchase-only types in purchases", () => {
    expect(filterVoucherTypesByApplicability(voucherTypes, "purchase").map((item) => item.id)).toEqual(["shared", "purchase"])
  })

  it("excludes purchase-only types from sales", () => {
    expect(filterVoucherTypesByApplicability(voucherTypes, "sale").map((item) => item.id)).toEqual(["shared", "sale"])
  })

  it("rejects a purchase-only type submitted through the sales service", async () => {
    const repository = new VoucherRepository() as jest.Mocked<VoucherRepository>
    repository.isVoucherTypeApplicable.mockResolvedValue(false)
    const service = new VoucherService(repository)
    const input: VoucherFactoryInput = {
      companyId: "123e4567-e89b-12d3-a456-426614174000",
      type: "sale",
      voucherTypeId: "123e4567-e89b-12d3-a456-426614174001",
      voucherLetterId: "123e4567-e89b-12d3-a456-426614174002",
      posNumber: "00001",
      number: "00000001",
      clientId: "123e4567-e89b-12d3-a456-426614174003",
      supplierId: null,
      date: "2026-08-18T00:00:00.000Z",
      currency: "$",
      exchangeRate: 1,
      subtotal: 100,
      vatAmount: 21,
      totalAmount: 121,
      paymentMethod: "Transferencia",
      status: null,
      paymentDate: null,
      createdByUserId: "123e4567-e89b-12d3-a456-426614174004",
      retentions: [],
      perceptions: [],
      vatDetails: [],
    }

    await expect(service.createVoucher(input)).rejects.toMatchObject({ publicMessage: voucherTypeNotApplicableMessage })
  })
})
