import { VoucherFactory } from "src/models/voucher/VoucherFactory"
import { Purchase } from "src/models/voucher/Purchase"
import { VoucherService } from "src/services/voucher/Voucher"
import { VoucherRepository } from "src/repositories/voucher/voucher.repository"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { VoucherFactoryInput } from "src/types/voucher/domain"
import { SupplierRepositoryContract } from "src/types/third-party/supplier-repository"

jest.mock("src/repositories/voucher/voucher.repository")
jest.mock("src/repositories/third-party/supplier.repository", () => ({ SupplierRepository: class {} }))

const validUuid = "123e4567-e89b-12d3-a456-426614174000"

function createNonFiscalPurchaseInput(overrides: Partial<VoucherFactoryInput> = {}): VoucherFactoryInput {
  return {
    companyId: validUuid,
    type: "purchase",
    voucherTypeId: validUuid,
    voucherLetterId: null,
    posNumber: null,
    number: null,
    clientId: null,
    supplierId: validUuid,
    documentIdentificationMode: "non_fiscal",
    date: "2026-08-18T00:00:00.000Z",
    currency: "$",
    exchangeRate: 1,
    subtotal: 100,
    vatAmount: 0,
    totalAmount: 100,
    paymentMethod: "Transferencia",
    status: null,
    paymentDate: null,
    concept: "Pago de impuesto",
    comments: null,
    createdByUserId: validUuid,
    retentions: [],
    perceptions: [],
    vatDetails: [],
    ...overrides,
  }
}

function createSupplierRepository(taxIdentificationMode: "with_cuit" | "without_cuit"): SupplierRepositoryContract {
  return {
    findById: jest.fn().mockResolvedValue({ id: validUuid, companyId: validUuid, name: "Servicios", cuit: taxIdentificationMode === "with_cuit" ? "30-11111111-9" : null, taxIdentificationMode, createdAt: new Date(), updatedAt: new Date() }),
    findByCuitAndCompany: jest.fn(),
    findByNormalizedName: jest.fn(),
    findAll: jest.fn(),
    findPage: jest.fn(),
    hasVouchers: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}

describe("Non-fiscal purchases", () => {
  it("creates a purchase without fiscal numbering", () => {
    const purchase = VoucherFactory.create(createNonFiscalPurchaseInput())

    expect(purchase).toBeInstanceOf(Purchase)
    expect(purchase.documentIdentificationMode).toBe("non_fiscal")
    expect(purchase.voucherLetterId).toBeNull()
    expect(purchase.posNumber).toBeNull()
    expect(purchase.number).toBeNull()
  })

  it("requires confirmation before saving a possible non-fiscal duplicate", async () => {
    const repositoryMock = new VoucherRepository() as jest.Mocked<VoucherRepository>
    const supplierRepository = createSupplierRepository("without_cuit")
    const service = new VoucherService(repositoryMock, supplierRepository)
    repositoryMock.findDuplicate.mockResolvedValue(VoucherFactory.create(createNonFiscalPurchaseInput({ id: validUuid })))

    await expect(service.createVoucher(createNonFiscalPurchaseInput())).rejects.toMatchObject({
      code: applicationErrorCodes.conflict,
      publicMessage: "Posible comprobante duplicado",
    })
  })

  it("preserves a historical non-fiscal mode when the supplier later has a CUIT", async () => {
    const repositoryMock = new VoucherRepository() as jest.Mocked<VoucherRepository>
    const supplierRepository = createSupplierRepository("with_cuit")
    const service = new VoucherService(repositoryMock, supplierRepository)
    const historicalPurchase = VoucherFactory.create(createNonFiscalPurchaseInput({ id: validUuid }))
    repositoryMock.findById.mockResolvedValue(historicalPurchase)
    repositoryMock.findDuplicate.mockResolvedValue(null)
    repositoryMock.update.mockImplementation(async (voucher) => voucher)

    const updatedPurchase = await service.updateVoucher(validUuid, validUuid, createNonFiscalPurchaseInput({ supplierId: validUuid }))

    expect(updatedPurchase.documentIdentificationMode).toBe("non_fiscal")
    expect(updatedPurchase.voucherLetterId).toBeNull()
  })

  it("requires confirmation when changing a non-fiscal purchase to a supplier with CUIT", async () => {
    const repositoryMock = new VoucherRepository() as jest.Mocked<VoucherRepository>
    const supplierRepository = createSupplierRepository("with_cuit")
    const service = new VoucherService(repositoryMock, supplierRepository)
    repositoryMock.findById.mockResolvedValue(VoucherFactory.create(createNonFiscalPurchaseInput({ id: validUuid })))

    await expect(service.updateVoucher(validUuid, validUuid, createNonFiscalPurchaseInput({ supplierId: "123e4567-e89b-12d3-a456-426614174002", documentIdentificationMode: "fiscal", voucherLetterId: validUuid, posNumber: "00001", number: "00000001" }))).rejects.toMatchObject({ publicMessage: "Debés confirmar la conversión de identificación del comprobante." })
  })
})
