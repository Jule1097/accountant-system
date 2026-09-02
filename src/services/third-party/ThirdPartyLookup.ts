import { ClientRepository } from "src/repositories/third-party/client.repository"
import { SupplierRepository } from "src/repositories/third-party/supplier.repository"
import { ClientRepositoryContract } from "src/types/third-party/client-repository"
import { SupplierRepositoryContract } from "src/types/third-party/supplier-repository"
import { ThirdPartyLookup } from "src/types/third-party/third-party-lookup"

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
}
