import { ClientRepository } from 'src/repositories/client.repository'

export class ClientService {

  private repository: ClientRepository

  constructor() {
    this.repository = new ClientRepository()
  }

  async getAllClients(companyId: string) {
    return this.repository.findAll(companyId)
  }

  async getClientById(companyId: string, id: string) {
    return this.repository.findById(companyId, id)
  }

  async createClient(companyId: string, name: string, cuit: string) {
    const existing = await this.repository.findByCuit(cuit)
    if (existing) {
      throw new Error('El CUIT del cliente ya se encuentra registrado en el sistema.')
    }
    return this.repository.create({
      companyId,
      name,
      cuit,
    })
  }

  async updateClient(companyId: string, id: string, name?: string, cuit?: string) {
    if (cuit) {
      const existing = await this.repository.findByCuit(cuit)
      if (existing && existing.id !== id) {
        throw new Error('El CUIT del cliente ya se encuentra registrado en el sistema.')
      }
    }
    return this.repository.update(companyId, id, { name, cuit })
  }

  async deleteClient(companyId: string, id: string) {
    return this.repository.delete(companyId, id)
  }

}
