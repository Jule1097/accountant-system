/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { ClientSupplierTable } from 'src/components/third-party/third-party-table'

describe('ClientSupplierTable', () => {
  const baseProps = {
    data: {
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
    },
    query: {
      page: 1,
      pageSize: 10,
      search: 'acme',
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
      recordId: null,
    },
    searchValue: 'acme',
    type: 'clients' as const,
    onAdd: jest.fn(),
    onSelectRecord: jest.fn(),
    onDeleteRecord: jest.fn(),
    onSearchChange: jest.fn(),
    onClearFilters: jest.fn(),
    onSortChange: jest.fn(),
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    onRetry: jest.fn(),
  }

  it('hides clear filters while the filtered response is loading', () => {
    render(<ClientSupplierTable {...baseProps} isLoading />)

    expect(screen.queryByRole('button', { name: /borrar filtros/i })).not.toBeInTheDocument()
  })

  it('shows clear filters after the filtered response finishes loading', () => {
    render(<ClientSupplierTable {...baseProps} isLoading={false} />)

    expect(screen.getByRole('button', { name: /borrar filtros/i })).toBeInTheDocument()
  })

  it('renders the empty state when the response contains no records', () => {
    render(<ClientSupplierTable {...baseProps} isLoading={false} />)

    expect(screen.getByText('No se encontraron registros.')).toBeInTheDocument()
  })

  it('hides clear filters while the local search value is waiting to be applied', () => {
    render(<ClientSupplierTable {...baseProps} searchValue="new search" isLoading={false} />)

    expect(screen.queryByRole('button', { name: /borrar filtros/i })).not.toBeInTheDocument()
  })
})
