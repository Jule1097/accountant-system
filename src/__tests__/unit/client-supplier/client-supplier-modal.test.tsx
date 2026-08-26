/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ClientSupplierModal } from 'src/components/clients-suppliers/client-supplier-modal'

const toastAdd = jest.fn()
const apiRequestMock = jest.fn()

jest.mock('src/components/ui/toast', () => ({
  useToastManager: () => ({ add: toastAdd }),
}))

jest.mock('src/lib/api/api-client', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}))

describe('ClientSupplierModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps the submit button disabled until name and cuit are completed', async () => {
    render(
      <ClientSupplierModal
        isOpen
        type="clients"
        mode="create"
        onOpenChange={jest.fn()}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Guardar' })

    expect(submitButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Acme' } })

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })

    fireEvent.change(screen.getByLabelText('CUIT'), { target: { value: '20-12345678-3' } })

    await waitFor(() => {
      expect(submitButton).toBeEnabled()
    })
  })
})
