import { ClientRepository } from 'src/repositories/client.repository'
import { normalizeCuit } from 'src/lib/cuit'
import { Client } from 'src/generated/prisma/client'
import { normalizeClientSupplierName } from 'src/lib/helpers/client-supplier'
import { ClientListResponse, ClientSupplierFilterParams } from 'src/types/client-supplier'
import { clientDuplicateCuitError, clientDuplicateNameError, clientDeleteBlockedError, clientNotFoundError } from 'src/lib/constants/messages'

export class ClientService {

  private repository: ClientRepository

  constructor() {
    this.repository = new ClientRepository()
  }

  async getAllClients(companyId: string): Promise<Client[]> {
    return this.repository.findAll(companyId)
  }

  async getClientPage(
    companyId: string,
    page: number,
    pageSize: number,
    filters: ClientSupplierFilterParams = {}
  ): Promise<ClientListResponse> {
    return this.repository.findPage(companyId, page, pageSize, filters)
  }

  async getClientById(companyId: string, id: string): Promise<Client | null> {
    return this.repository.findById(companyId, id)
  }

  async createClient(companyId: string, name: string, cuit: string): Promise<Client> {
    const normalizedName = normalizeClientSupplierName(name)
    const normalizedCuit = normalizeCuit(cuit)
    const existingByName = await this.repository.findByNormalizedName(companyId, normalizedName)

    if (existingByName) {
      throw new Error(clientDuplicateNameError)
    }

    const existingByCuit = await this.repository.findByCuitAndCompany(companyId, normalizedCuit)
    if (existingByCuit) {
      throw new Error(clientDuplicateCuitError)
    }

    return this.repository.create({
      companyId,
      name: name.trim(),
      cuit: normalizedCuit,
    })
  }

  async updateClient(companyId: string, id: string, name: string, cuit: string): Promise<Client> {
    const existing = await this.repository.findById(companyId, id)

    if (!existing) {
      throw new Error(clientNotFoundError)
    }

    const normalizedName = normalizeClientSupplierName(name)
    const normalizedCuit = normalizeCuit(cuit)
    const existingByName = await this.repository.findByNormalizedName(companyId, normalizedName, id)

    if (existingByName) {
      throw new Error(clientDuplicateNameError)
    }

    const existingByCuit = await this.repository.findByCuitAndCompany(companyId, normalizedCuit)
    if (existingByCuit && existingByCuit.id !== id) {
      throw new Error(clientDuplicateCuitError)
    }

    return this.repository.update(companyId, id, { name: name.trim(), cuit: normalizedCuit })
  }

  async deleteClient(companyId: string, id: string): Promise<Client> {
    const existing = await this.repository.findById(companyId, id)

    if (!existing) {
      throw new Error(clientNotFoundError)
    }

    const hasVouchers = await this.repository.hasVouchers(companyId, id)
    if (hasVouchers) {
      throw new Error(clientDeleteBlockedError)
    }

    return this.repository.delete(companyId, id)
  }

}
