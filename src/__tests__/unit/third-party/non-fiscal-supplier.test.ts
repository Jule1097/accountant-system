import { Supplier } from "src/models/third-party/Supplier"
import { supplierSchema } from "src/lib/schemas/third-party/third-party-schemas"
import { SupplierService } from "src/services/third-party/Supplier"
import { SupplierRepositoryContract } from "src/types/third-party/supplier-repository"

const companyId = "123e4567-e89b-12d3-a456-426614174000"
const supplierId = "123e4567-e89b-12d3-a456-426614174001"
const validCuit = "30-11111111-9"

function createRepository(): jest.Mocked<SupplierRepositoryContract> {
  return {
    findById: jest.fn(),
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

describe("Non-fiscal supplier contracts", () => {
  it("accepts a supplier without CUIT and persists a null CUIT", () => {
    const result = supplierSchema.safeParse({
      name: "  Servicios generales  ",
      taxIdentificationMode: "without_cuit",
      cuit: null,
    })

    expect(result.success).toBe(true)
    expect(new Supplier({ companyId, name: "Servicios generales", taxIdentificationMode: "without_cuit", cuit: null }).cuit).toBeNull()
  })

  it("requires a CUIT for a supplier with CUIT", () => {
    expect(supplierSchema.safeParse({ name: "Servicios", taxIdentificationMode: "with_cuit", cuit: null }).success).toBe(false)
  })

  it("infers the CUIT mode for a legacy supplier payload", () => {
    expect(supplierSchema.parse({ name: "Servicios", cuit: validCuit })).toMatchObject({ taxIdentificationMode: "with_cuit", cuit: validCuit })
  })

  it("blocks removing a supplier CUIT when purchases exist", async () => {
    const repository = createRepository()
    const service = new SupplierService(repository)
    repository.findById.mockResolvedValue({ id: supplierId, companyId, name: "Servicios", cuit: validCuit, taxIdentificationMode: "with_cuit", createdAt: new Date(), updatedAt: new Date() })
    repository.hasVouchers.mockResolvedValue(true)

    await expect(service.updateSupplier(companyId, supplierId, "Servicios", "without_cuit", null)).rejects.toMatchObject({
      publicMessage: expect.stringContaining("CUIT"),
    })
    expect(repository.update).not.toHaveBeenCalled()
  })
})
