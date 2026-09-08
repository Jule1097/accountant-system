import { Sale } from "src/models/voucher/Sale"
import { VoucherRepository } from "src/repositories/voucher/voucher.repository"
import { VoucherService } from "src/services/voucher/Voucher"

jest.mock("src/repositories/voucher/voucher.repository")

describe("VoucherService domain boundary", () => {
  it("creates a concrete domain voucher before calling the repository", async () => {
    const repository = new VoucherRepository() as jest.Mocked<VoucherRepository>
    const service = new VoucherService()
    Object.defineProperty(service, "repository", { value: repository, writable: true })
    repository.findDuplicate.mockResolvedValue(null)
    repository.create.mockImplementation(async (voucher) => voucher)

    const result = await service.createVoucher({
      companyId: "company-1",
      type: "sale",
      voucherTypeId: "voucher-type-1",
      voucherLetterId: "voucher-letter-1",
      posNumber: "00001",
      number: "00000001",
      clientId: "client-1",
      date: "2026-01-15T00:00:00.000Z",
      accountingPeriod: "2026-01-01T00:00:00.000Z",
      currency: "ARS",
      exchangeRate: "1.0000",
      subtotal: "100.00",
      vatAmount: "21.00",
      nonTaxableAmount: "0.00",
      exemptAmount: "0.00",
      otherTaxesAmount: "0.00",
      paidAmount: "0.00",
      paymentMethod: "cash",
      paymentDate: null,
      status: null,
      concept: null,
      comments: null,
      createdByUserId: "user-1",
      retentions: [],
      vatDetails: [],
    })

    expect(repository.create).toHaveBeenCalledWith(expect.any(Sale))
    expect(result).toBeInstanceOf(Sale)
    expect(result.totalAmount.toString()).toBe("121.00")
  })
})
