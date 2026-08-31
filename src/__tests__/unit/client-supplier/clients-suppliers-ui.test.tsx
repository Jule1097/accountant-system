/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { ClientsSuppliersManagementView } from 'src/components/clients-suppliers/clients-suppliers-management-view'

const pushMock = jest.fn()
const searchParamsState = {
  pathname: '/clients',
}

jest.mock('next/navigation', () => ({
  usePathname: () => searchParamsState.pathname,
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams('page=1&pageSize=10'),
}))

jest.mock('src/hooks/client-supplier/use-clients-suppliers-management', () => ({
  useClientsSuppliersManagement: () => ({
    isCreateModalOpen: false,
    isDeleting: false,
    recordId: null,
    viewRecordId: null,
    recordPendingDelete: null,
    query: { page: 1, pageSize: 10, sortBy: 'name', sortOrder: 'asc', recordId: null },
    searchValue: '',
    isTableLoading: false,
    data: {
      items: [{ id: 'client-1', name: 'Acme', cuit: '20123456783' }],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    },
    recordDetail: undefined,
    recordDetailError: undefined,
    isRecordDetailLoading: false,
    openCreateModal: jest.fn(),
    handleCreateModalOpenChange: jest.fn(),
    handleEditModalOpenChange: jest.fn(),
    handleSelectRecord: jest.fn(),
    handleCreateSuccess: jest.fn(),
    handleEditSuccess: jest.fn(),
    handleDeleteRecord: jest.fn(),
    handleDeleteDialogOpenChange: jest.fn(),
    handleRecordDetailError: jest.fn(),
    handleSearchChange: jest.fn(),
    handleClearFilters: jest.fn(),
    handleSortChange: jest.fn(),
    handlePageChange: jest.fn(),
    handlePageSizeChange: jest.fn(),
    confirmRecordDelete: jest.fn(),
    goToClients: () => pushMock('/clients'),
    goToSuppliers: () => pushMock('/suppliers'),
  }),
}))

jest.mock('src/components/clients-suppliers/client-supplier-table', () => ({
  ClientSupplierTable: ({
    data,
    onSearchChange,
  }: {
    data: { items: Array<{ id: string; name: string; cuit: string }> }
    onSearchChange: (value: string) => void
  }) => (
    <div>
      <input
        aria-label="Buscar cliente o proveedor"
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {data.items.map((item) => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>{item.cuit}</span>
        </div>
      ))}
    </div>
  ),
}))

jest.mock('src/components/clients-suppliers/client-supplier-modal', () => ({
  ClientSupplierModal: ({
    isOpen,
    mode,
  }: {
    isOpen: boolean
    mode: 'create' | 'edit'
  }) => (
    isOpen ? <div data-testid={`${mode}-client-supplier-modal`}>open</div> : null
  ),
  ClientSupplierDetailModal: ({
    isOpen,
  }: {
    isOpen: boolean
  }) => (
    isOpen ? <div data-testid="view-client-supplier-modal">open</div> : null
  ),
}))

jest.mock('src/components/clients-suppliers/client-supplier-delete-dialog', () => ({
  ClientSupplierDeleteDialog: ({
    isOpen,
  }: {
    isOpen: boolean
  }) => (
    isOpen ? <div data-testid="delete-client-supplier-dialog">open</div> : null
  ),
}))

describe('ClientsSuppliersManagementView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('activates the clients tab on the clients route and navigates to suppliers', () => {
    searchParamsState.pathname = '/clients'

    render(
      <ClientsSuppliersManagementView
        type="clients"
        title="Clientes y Proveedores"
        description="Gestioná clientes y proveedores desde un módulo compartido."
      />
    )

    expect(screen.getByRole('button', { name: 'Clientes' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('button', { name: 'Proveedores' })).toHaveAttribute('data-active', 'false')
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('20123456783')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Proveedores' }))

    expect(pushMock).toHaveBeenCalledWith('/suppliers')
  })

  it('activates the suppliers tab on the suppliers route', () => {
    searchParamsState.pathname = '/suppliers'

    render(
      <ClientsSuppliersManagementView
        type="suppliers"
        title="Clientes y Proveedores"
        description="Gestioná clientes y proveedores desde un módulo compartido."
      />
    )

    expect(screen.getByRole('button', { name: 'Clientes' })).toHaveAttribute('data-active', 'false')
    expect(screen.getByRole('button', { name: 'Proveedores' })).toHaveAttribute('data-active', 'true')
  })

  it('does not mount closed overlays while the list screen is idle', () => {
    render(
      <ClientsSuppliersManagementView
        type="clients"
        title="Clientes y Proveedores"
        description="Gestioná clientes y proveedores desde un módulo compartido."
      />
    )

    expect(screen.queryByTestId('create-client-supplier-modal')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-client-supplier-modal')).not.toBeInTheDocument()
    expect(screen.queryByTestId('view-client-supplier-modal')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-client-supplier-dialog')).not.toBeInTheDocument()
  })
})
