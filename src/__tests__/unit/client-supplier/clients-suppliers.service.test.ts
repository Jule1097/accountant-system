import { ClientRepository } from 'src/repositories/client-supplier/client.repository'
import { SupplierRepository } from 'src/repositories/client-supplier/supplier.repository'
import { ClientService } from 'src/services/client-supplier/client.service'
import { SupplierService } from 'src/services/client-supplier/supplier.service'

jest.mock('src/repositories/client-supplier/client.repository')
jest.mock('src/repositories/client-supplier/supplier.repository')

const createdAt = new Date('2026-08-25T00:00:00.000Z')
const updatedAt = new Date('2026-08-25T00:00:00.000Z')

type ClientRepositoryMock = jest.Mocked<ClientRepository> & {
  findByNormalizedName: jest.Mock
  hasVouchers: jest.Mock
}

type SupplierRepositoryMock = jest.Mocked<SupplierRepository> & {
  findByNormalizedName: jest.Mock
  hasVouchers: jest.Mock
}

describe('ClientService', () => {
  const companyId = '123e4567-e89b-12d3-a456-426614174000'
  let service: ClientService
  let repositoryMock: ClientRepositoryMock

  beforeEach(() => {
    jest.clearAllMocks()
    repositoryMock = new ClientRepository() as ClientRepositoryMock
    repositoryMock.findByNormalizedName = jest.fn().mockResolvedValue(null)
    repositoryMock.hasVouchers = jest.fn().mockResolvedValue(false)
    service = new ClientService()
    ;(service as unknown as { repository: ClientRepository }).repository = repositoryMock
  })

  it('rejects duplicate names using trim and case-insensitive comparison', async () => {
    repositoryMock.findByNormalizedName.mockResolvedValue({
      id: 'client-1',
      name: 'ACME',
    })

    await expect(service.createClient(companyId, '  acme  ', '20-12345678-3')).rejects.toThrow('El cliente ya existe')
    expect(repositoryMock.create).not.toHaveBeenCalled()
    expect(repositoryMock.findByNormalizedName).toHaveBeenCalledWith(companyId, 'acme')
  })

  it('rejects duplicate cuit inside the same company and entity type', async () => {
    repositoryMock.findByCuitAndCompany.mockResolvedValue({
      id: 'client-1',
      companyId,
      name: 'Acme',
      cuit: '20123456783',
      createdAt,
      updatedAt,
    })

    await expect(service.createClient(companyId, 'Acme', '20-12345678-3')).rejects.toThrow('El CUIT ya existe')
    expect(repositoryMock.create).not.toHaveBeenCalled()
  })

  it('blocks deletion when the client has persisted vouchers', async () => {
    repositoryMock.findById.mockResolvedValue({
      id: 'client-1',
      companyId,
      name: 'Acme',
      cuit: '20123456783',
      createdAt,
      updatedAt,
    })
    repositoryMock.hasVouchers.mockResolvedValue(true)

    await expect(service.deleteClient(companyId, 'client-1')).rejects.toThrow(
      'No se puede eliminar el cliente porque tiene comprobantes asociados.'
    )
    expect(repositoryMock.delete).not.toHaveBeenCalled()
  })
})

describe('SupplierService', () => {
  const companyId = '123e4567-e89b-12d3-a456-426614174001'
  let service: SupplierService
  let repositoryMock: SupplierRepositoryMock

  beforeEach(() => {
    jest.clearAllMocks()
    repositoryMock = new SupplierRepository() as SupplierRepositoryMock
    repositoryMock.findByNormalizedName = jest.fn().mockResolvedValue(null)
    repositoryMock.hasVouchers = jest.fn().mockResolvedValue(false)
    service = new SupplierService()
    ;(service as unknown as { repository: SupplierRepository }).repository = repositoryMock
  })

  it('rejects duplicate names using trim and case-insensitive comparison', async () => {
    repositoryMock.findByNormalizedName.mockResolvedValue({
      id: 'supplier-1',
      name: 'Servicios SRL',
    })

    await expect(service.createSupplier(companyId, '  servicios srl ', '20-12345678-3')).rejects.toThrow(
      'El proveedor ya existe'
    )
    expect(repositoryMock.create).not.toHaveBeenCalled()
    expect(repositoryMock.findByNormalizedName).toHaveBeenCalledWith(companyId, 'servicios srl')
  })

  it('rejects duplicate cuit inside the same company and entity type', async () => {
    repositoryMock.findByCuitAndCompany.mockResolvedValue({
      id: 'supplier-1',
      companyId,
      name: 'Servicios SRL',
      cuit: '20123456783',
      createdAt,
      updatedAt,
    })

    await expect(service.createSupplier(companyId, 'Servicios SRL', '20-12345678-3')).rejects.toThrow(
      'El CUIT ya existe'
    )
    expect(repositoryMock.create).not.toHaveBeenCalled()
  })

  it('blocks deletion when the supplier has persisted vouchers', async () => {
    repositoryMock.findById.mockResolvedValue({
      id: 'supplier-1',
      companyId,
      name: 'Servicios SRL',
      cuit: '20123456783',
      createdAt,
      updatedAt,
    })
    repositoryMock.hasVouchers.mockResolvedValue(true)

    await expect(service.deleteSupplier(companyId, 'supplier-1')).rejects.toThrow(
      'No se puede eliminar el proveedor porque tiene comprobantes asociados.'
    )
    expect(repositoryMock.delete).not.toHaveBeenCalled()
  })
})
