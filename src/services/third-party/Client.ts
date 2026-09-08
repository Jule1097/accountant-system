import { ClientRepository } from 'src/repositories/third-party/client.repository'
import { Client } from 'src/generated/prisma/client'
import { ClientListResponse, ClientSupplierFilterParams } from 'src/types/third-party/third-party-resource'
import { clientDuplicateCuitError, clientDuplicateNameError, clientDeleteBlockedError, clientNotFoundError } from 'src/lib/constants/messages'
import { Client as ClientModel } from 'src/models/third-party/Client'
import { ClientRepositoryContract } from 'src/types/third-party/client-repository'
import { ThirdPartyService } from 'src/services/third-party/ThirdParty'

export class ClientService {

  private readonly service: ThirdPartyService<Client, Parameters<ClientRepositoryContract['create']>[0], Parameters<ClientRepositoryContract['update']>[2]>

  constructor(repository: ClientRepositoryContract = new ClientRepository()) {
    this.service = new ThirdPartyService({
      repository,
      createModel: (data) => new ClientModel(data),
      getRecordId: (record) => record.id,
      messages: {
        duplicateName: clientDuplicateNameError,
        duplicateCuit: clientDuplicateCuitError,
        notFound: clientNotFoundError,
        deleteBlocked: clientDeleteBlockedError,
      },
    })
  }

  async getAllClients(companyId: string): Promise<Client[]> {
    return this.service.getAll(companyId)
  }

  async getClientPage(
    companyId: string,
    page: number,
    pageSize: number,
    filters: ClientSupplierFilterParams = {}
  ): Promise<ClientListResponse> {
    return this.service.getPage(companyId, page, pageSize, filters)
  }

  async getClientById(companyId: string, id: string): Promise<Client | null> {
    return this.service.getById(companyId, id)
  }

  async createClient(companyId: string, name: string, cuit: string): Promise<Client> {
    return this.service.create(companyId, name, cuit)
  }

  async updateClient(companyId: string, id: string, name: string, cuit: string): Promise<Client> {
    return this.service.update(companyId, id, name, cuit)
  }

  async deleteClient(companyId: string, id: string): Promise<Client> {
    return this.service.delete(companyId, id)
  }

}
