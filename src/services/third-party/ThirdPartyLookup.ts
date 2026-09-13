import { ClientRepository } from "src/repositories/third-party/client.repository"
import { SupplierRepository } from "src/repositories/third-party/supplier.repository"
import { ClientRepositoryContract } from "src/types/third-party/client-repository"
import { SupplierRepositoryContract } from "src/types/third-party/supplier-repository"
import { ThirdPartyLookup } from "src/types/third-party/third-party-lookup"
import { normalizeThirdPartyName } from "src/lib/helpers/third-party/third-party"

export class ThirdPartyLookupService implements ThirdPartyLookup {
  private readonly clientRepository: ClientRepositoryContract
  private readonly supplierRepository: SupplierRepositoryContract

  constructor(
    clientRepository: ClientRepositoryContract = new ClientRepository(),
    supplierRepository: SupplierRepositoryContract = new SupplierRepository()
  ) {
    this.clientRepository = clientRepository
    this.supplierRepository = supplierRepository
  }

  async findIdByCuit(companyId: string, cuit: string): Promise<string | null> {
    const client = await this.clientRepository.findByCuitAndCompany(companyId, cuit)
    if (client) {
      return client.id
    }

    const supplier = await this.supplierRepository.findByCuitAndCompany(companyId, cuit)
    return supplier?.id ?? null
  }

  async findIdByIdentity(companyId: string, cuit: string | null, name: string | null, type: "sale" | "purchase"): Promise<string | null> {
    const cuitMatch = cuit ? await this.findIdByCuit(companyId, cuit) : null
    if (cuitMatch) return cuitMatch
    if (!name) return null
    const repository = type === "purchase" ? this.supplierRepository : this.clientRepository
    const record = await repository.findByNormalizedName(companyId, normalizeThirdPartyName(name))
    return record?.id ?? null
  }
}
