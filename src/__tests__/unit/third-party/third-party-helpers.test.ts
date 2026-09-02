import { buildClientSupplierCollectionPath } from 'src/lib/helpers/third-party/third-party-management'
import {
  buildClientSupplierDeleteErrorFeedback,
  buildClientSupplierDeleteSuccessFeedback,
  buildClientSupplierResolvedFeedback,
  buildClientSupplierSaveFeedback,
  buildClientSupplierSubmitErrorFeedback,
} from 'src/lib/helpers/third-party/third-party-ui'

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

  it('builds reusable deletion feedback without performing side effects', () => {
    expect(buildClientSupplierDeleteSuccessFeedback('clients')).toEqual({
      type: 'success',
      title: 'Cliente eliminado',
      description: 'El cliente se eliminó correctamente.',
    })
    expect(buildClientSupplierDeleteErrorFeedback('suppliers', 'No se pudo eliminar el proveedor.')).toEqual({
      type: 'error',
      title: 'No se pudo eliminar',
      description: 'No se pudo eliminar el proveedor.',
    })
  })

  it('builds reusable form feedback for save, duplicate resolution, and errors', () => {
    expect(buildClientSupplierSaveFeedback('clients', 'create')).toEqual({
      type: 'success',
      title: 'Cliente guardado',
      description: 'El cliente se guardó correctamente.',
    })
    expect(buildClientSupplierResolvedFeedback('suppliers')).toEqual({
      type: 'success',
      title: 'Proveedor seleccionado',
      description: 'Se seleccionó el proveedor que ya existía.',
    })
    expect(buildClientSupplierSubmitErrorFeedback('edit', 'Error de API')).toEqual({
      type: 'error',
      title: 'No se pudo actualizar',
      description: 'Error de API',
    })
  })
})
