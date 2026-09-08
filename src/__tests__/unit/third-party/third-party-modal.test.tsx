/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ClientSupplierModal } from 'src/components/third-party/third-party-modal'
import { ApiRequestError } from 'src/lib/api/api-client'

const toastAdd = jest.fn()
const apiRequestMock = jest.fn()
const createResourceMock = jest.fn()
const updateResourceMock = jest.fn()

jest.mock('src/components/ui/toast', () => ({
  useToastManager: () => ({ add: toastAdd }),
}))

jest.mock('src/lib/api/api-client', () => ({
  ...jest.requireActual('src/lib/api/api-client'),
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}))

jest.mock('src/hooks/shared/use-resource', () => ({
  useResourceMutation: () => ({
    create: createResourceMock,
    update: updateResourceMock,
  }),
}))

describe('ClientSupplierModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createResourceMock.mockResolvedValue({ id: 'client-1', name: 'Acme', cuit: '20-12345678-3' })
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

  it('submits a valid create form, closes the modal, and reports success', async () => {
    const onOpenChange = jest.fn()
    render(
      <ClientSupplierModal
        isOpen
        type="clients"
        mode="create"
        onOpenChange={onOpenChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText('CUIT'), { target: { value: '20-12345678-3' } })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createResourceMock).toHaveBeenCalledWith({ name: 'Acme', cuit: '20-12345678-3' })
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })
  })

  it('resolves a duplicate through the domain callback and closes the modal', async () => {
    const onOpenChange = jest.fn()
    const onResolveDuplicate = jest.fn().mockResolvedValue({ id: 'client-1' })
    createResourceMock.mockRejectedValue(new ApiRequestError('El cliente ya existe', 409, {}))

    render(
      <ClientSupplierModal
        isOpen
        type="clients"
        mode="create"
        onOpenChange={onOpenChange}
        onResolveDuplicate={onResolveDuplicate}
      />
    )

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText('CUIT'), { target: { value: '20-12345678-3' } })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(onResolveDuplicate).toHaveBeenCalledWith({ name: 'Acme', cuit: '20-12345678-3' })
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Cliente seleccionado' }))
    })
  })

  it('keeps the modal open and reports an API error when save fails', async () => {
    const onOpenChange = jest.fn()
    createResourceMock.mockRejectedValue(new Error('No se pudo guardar el cliente'))

    render(
      <ClientSupplierModal
        isOpen
        type="clients"
        mode="create"
        onOpenChange={onOpenChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText('CUIT'), { target: { value: '20-12345678-3' } })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        description: 'No se pudo guardar el cliente',
      }))
    })
  })
})
