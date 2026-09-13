import { ThirdPartyLookupService } from "src/services/third-party/ThirdPartyLookup"

describe("ThirdPartyLookupService", () => {
  it("resolves the client before trying the supplier repository", async () => {
    const clientRepository = {
      findByCuitAndCompany: jest.fn().mockResolvedValue({ id: "client-1" }),
    }
    const supplierRepository = {
      findByCuitAndCompany: jest.fn(),
    }
    const service = new ThirdPartyLookupService(clientRepository as never, supplierRepository as never)

    await expect(service.findIdByCuit("company-1", "20-12345678-3")).resolves.toBe("client-1")
    expect(supplierRepository.findByCuitAndCompany).not.toHaveBeenCalled()
  })

  it("resolves a purchase supplier by normalized name when CUIT is unavailable", async () => {
    const clientRepository = { findByCuitAndCompany: jest.fn(), findByNormalizedName: jest.fn() }
    const supplierRepository = { findByCuitAndCompany: jest.fn().mockResolvedValue(null), findByNormalizedName: jest.fn().mockResolvedValue({ id: "supplier-1" }) }
    const service = new ThirdPartyLookupService(clientRepository as never, supplierRepository as never)

    await expect(service.findIdByIdentity("company-1", null, "  Servicios Generales ", "purchase")).resolves.toBe("supplier-1")
    expect(supplierRepository.findByNormalizedName).toHaveBeenCalledWith("company-1", "servicios generales")
  })
})
