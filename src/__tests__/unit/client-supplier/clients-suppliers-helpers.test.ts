import { buildClientSupplierCollectionPath } from 'src/lib/helpers/client-supplier/client-supplier-management'

describe('client supplier management helpers', () => {
  it('always sends pagination params for management collection requests', () => {
    const path = buildClientSupplierCollectionPath('clients', {
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
      recordId: null,
    })

    expect(path).toBe('/api/clients?page=1&pageSize=10')
  })
})
