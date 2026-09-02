import { NextRequest } from 'next/server'
import { GET as getClients, POST as postClient } from 'src/app/api/clients/route'
import { DELETE as deleteClient } from 'src/app/api/clients/[id]/route'
import { GET as getSuppliers, POST as postSupplier } from 'src/app/api/suppliers/route'
import { DELETE as deleteSupplier } from 'src/app/api/suppliers/[id]/route'
import { ClientService } from 'src/services/third-party/Client'
import { SupplierService } from 'src/services/third-party/Supplier'

jest.mock('src/services/third-party/Client')
jest.mock('src/services/third-party/Supplier')

type ClientServiceMock = jest.MockedClass<typeof ClientService> & {
  prototype: {
    getClientPage: jest.Mock
    createClient: jest.Mock
    deleteClient: jest.Mock
  }
}

type SupplierServiceMock = jest.MockedClass<typeof SupplierService> & {
  prototype: {
    getSupplierPage: jest.Mock
    createSupplier: jest.Mock
    deleteSupplier: jest.Mock
  }
}

function createRequest(overrides: Partial<NextRequest> = {}) {
  const nextUrl = {
    searchParams: new URLSearchParams(),
  } as NextRequest['nextUrl']

  return {
    headers: { get: () => '123e4567-e89b-12d3-a456-426614174000' },
    json: async () => ({}),
    nextUrl,
    ...overrides,
  } as unknown as NextRequest
}

describe('Clients API Route Handlers', () => {
  const clientServiceMock = ClientService as unknown as ClientServiceMock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns a paginated client list using server-side query params', async () => {
    clientServiceMock.prototype.getClientPage = jest.fn().mockResolvedValue({
      items: [{ id: 'client-1', name: 'Acme', cuit: '20123456783' }],
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    })

    const response = await getClients(
      createRequest({
        nextUrl: {
          searchParams: new URLSearchParams({
            page: '2',
            pageSize: '20',
            search: 'acme',
            sortBy: 'name',
            sortOrder: 'asc',
          }),
        } as NextRequest['nextUrl'],
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [{ id: 'client-1', name: 'Acme', cuit: '20123456783' }],
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    })
    expect(clientServiceMock.prototype.getClientPage).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      2,
      20,
      {
        filters: {},
        search: 'acme',
        sortBy: 'name',
        sortOrder: 'asc',
      }
    )
  })

  it('returns 400 for invalid client list query params', async () => {
    const response = await getClients(
      createRequest({
        nextUrl: {
          searchParams: new URLSearchParams({
            page: '0',
            pageSize: '15',
          }),
        } as NextRequest['nextUrl'],
      })
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Parámetros de búsqueda inválidos.' })
  })

  it('returns 409 when client creation detects a duplicate name', async () => {
    clientServiceMock.prototype.createClient = jest.fn().mockRejectedValue(new Error('El cliente ya existe'))

    const response = await postClient(
      createRequest({
        json: async () => ({
          name: 'Acme',
          cuit: '20-12345678-3',
        }),
      })
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'El cliente ya existe' })
  })

  it('returns 409 when client deletion is blocked by related vouchers', async () => {
    clientServiceMock.prototype.deleteClient = jest.fn().mockRejectedValue(
      new Error('No se puede eliminar el cliente porque tiene comprobantes asociados.')
    )

    const response = await deleteClient(createRequest(), {
      params: Promise.resolve({ id: 'client-1' }),
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'No se puede eliminar el cliente porque tiene comprobantes asociados.',
    })
  })
})

describe('Suppliers API Route Handlers', () => {
  const supplierServiceMock = SupplierService as unknown as SupplierServiceMock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns a paginated supplier list using server-side query params', async () => {
    supplierServiceMock.prototype.getSupplierPage = jest.fn().mockResolvedValue({
      items: [{ id: 'supplier-1', name: 'Servicios SRL', cuit: '20123456783' }],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    })

    const response = await getSuppliers(
      createRequest({
        nextUrl: {
          searchParams: new URLSearchParams({
            page: '1',
            pageSize: '10',
            search: 'servicios',
            sortBy: 'cuit',
            sortOrder: 'desc',
          }),
        } as NextRequest['nextUrl'],
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [{ id: 'supplier-1', name: 'Servicios SRL', cuit: '20123456783' }],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    })
    expect(supplierServiceMock.prototype.getSupplierPage).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      1,
      10,
      {
        filters: {},
        search: 'servicios',
        sortBy: 'cuit',
        sortOrder: 'desc',
      }
    )
  })

  it('returns 409 when supplier creation detects a duplicate cuit', async () => {
    supplierServiceMock.prototype.createSupplier = jest.fn().mockRejectedValue(new Error('El CUIT ya existe'))

    const response = await postSupplier(
      createRequest({
        json: async () => ({
          name: 'Servicios SRL',
          cuit: '20-12345678-3',
        }),
      })
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'El CUIT ya existe' })
  })

  it('returns 409 when supplier deletion is blocked by related vouchers', async () => {
    supplierServiceMock.prototype.deleteSupplier = jest.fn().mockRejectedValue(
      new Error('No se puede eliminar el proveedor porque tiene comprobantes asociados.')
    )

    const response = await deleteSupplier(createRequest(), {
      params: Promise.resolve({ id: 'supplier-1' }),
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'No se puede eliminar el proveedor porque tiene comprobantes asociados.',
    })
  })
})
