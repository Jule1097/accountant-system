/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import {
  ClientSupplierDetailModal,
  ClientSupplierModal,
} from 'src/components/third-party/third-party-modal'

jest.mock("src/components/ui/toast", () => ({
  useToastManager: () => ({ add: jest.fn() }),
}))

describe('ClientSupplier loading states', () => {
  it('shows a loading state while the detail modal fetches the selected record', () => {
    render(
      <ClientSupplierDetailModal
        isOpen
        type="clients"
        isLoading
        onOpenChange={jest.fn()}
        onLoadError={jest.fn()}
      />
    )

    expect(screen.getByText('Cargando cliente')).toBeInTheDocument()
    expect(screen.getByText('Estamos trayendo la información para mostrar el detalle.')).toBeInTheDocument()
  })

  it('shows a loading state while the edit modal fetches the selected record', () => {
    render(
      <ClientSupplierModal
        isOpen
        type="suppliers"
        mode="edit"
        isLoading
        onOpenChange={jest.fn()}
      />
    )

    expect(screen.getByText('Cargando proveedor')).toBeInTheDocument()
    expect(screen.getByText('Estamos trayendo la información para editar el registro.')).toBeInTheDocument()
  })
})
