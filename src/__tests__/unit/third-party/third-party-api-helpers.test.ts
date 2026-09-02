import {
  parseClientSupplierListQuery,
  resolveClientSupplierCollectionErrorResponse,
  resolveClientSupplierItemErrorResponse,
} from 'src/lib/helpers/third-party/third-party-api'

describe('client supplier api helpers', () => {
  it('parses paginated list query params', () => {
    const searchParams = new URLSearchParams({
      page: '2',
      pageSize: '20',
      search: 'acme',
      sortBy: 'cuit',
      sortOrder: 'desc',
      status: 'ignored',
    })

    expect(parseClientSupplierListQuery(searchParams)).toEqual({
      success: true,
      data: {
        page: 2,
        pageSize: 20,
        search: 'acme',
        sortBy: 'cuit',
        sortOrder: 'desc',
        filters: {
          status: 'ignored',
        },
      },
    })
  })

  it('maps duplicate collection errors to 409', async () => {
    const response = resolveClientSupplierCollectionErrorResponse('El cliente ya existe')

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'El cliente ya existe' })
  })

  it('maps missing item errors to 404', async () => {
    const response = resolveClientSupplierItemErrorResponse('Proveedor no encontrado')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Proveedor no encontrado' })
  })
})
