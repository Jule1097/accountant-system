/** @jest-environment jsdom */

import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { VoucherManagementView } from 'src/components/vouchers/voucher-management-view'
import { VoucherModalPerceptions } from 'src/components/vouchers/voucher-modal-perceptions'
import { useVoucherForm, VoucherFormValues } from 'src/hooks/use-voucher-form'
import { ApiRequestError } from 'src/lib/api-client'
import { Voucher } from 'src/models/Voucher'
import { VoucherListResponse, VoucherSummaryResponse } from 'src/types/voucher'

const toastAdd = jest.fn()
const apiRequestMock = jest.fn()
const useVouchersMock = jest.fn()
const useVoucherSummaryMock = jest.fn()
const useVoucherByIdMock = jest.fn()
const replaceMock = jest.fn()
const searchParamsState = {
  value: '',
}
const searchParamsMock = {
  get: (key: string) => new URLSearchParams(searchParamsState.value).get(key),
  toString: () => searchParamsState.value,
}

jest.mock('next/navigation', () => ({
  usePathname: () => '/sales',
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock,
}))

jest.mock('src/components/ui/toast', () => ({
  useToastManager: () => ({ add: toastAdd }),
}))

jest.mock('src/lib/api-client', () => ({
  ApiRequestError: class ApiRequestError extends Error {
    status: number
    payload: unknown

    constructor(message: string, status: number, payload: unknown) {
      super(message)
      this.status = status
      this.payload = payload
    }
  },
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}))

jest.mock('src/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '123e4567-e89b-12d3-a456-426614174099' },
  }),
}))

jest.mock('src/contexts/company-context', () => ({
  useCompany: () => ({
    activeCompanyId: '123e4567-e89b-12d3-a456-426614174011',
  }),
}))

jest.mock('src/hooks/use-vouchers', () => ({
  useVouchers: (...args: unknown[]) => useVouchersMock(...args),
  useVoucherSummary: (...args: unknown[]) => useVoucherSummaryMock(...args),
  useVoucherById: (...args: unknown[]) => useVoucherByIdMock(...args),
}))

jest.mock('src/components/vouchers/voucher-table', () => ({
  VoucherTable: ({
    data,
    onAdd,
    onSelectVoucher,
    onDeleteVoucher,
  }: {
    data: VoucherListResponse
    onAdd: () => void
    onSelectVoucher: (voucher: Voucher) => void
    onDeleteVoucher: (voucher: Voucher) => void
  }) => (
    <div data-testid="voucher-table-mock">
      <button type="button" onClick={onAdd}>
        Agregar
      </button>
      {data?.items?.map((item) => (
        <div key={item.voucher.id}>
          <button type="button" onClick={() => onSelectVoucher(item.voucher)}>
            Seleccionar {item.voucher.id}
          </button>
          <button type="button" onClick={() => onDeleteVoucher(item.voucher)}>
            Eliminar {item.voucher.id}
          </button>
        </div>
      ))}
    </div>
  ),
}))

const { VoucherTable: RealVoucherTable } = jest.requireActual('src/components/vouchers/voucher-table') as {
  VoucherTable: typeof import('src/components/vouchers/voucher-table').VoucherTable
}

jest.mock('src/components/vouchers/voucher-modal', () => ({
  VoucherModal: ({
    isOpen,
    mode,
    isLoadingDetail,
    initialVoucher,
  }: {
    isOpen: boolean
    mode: 'create' | 'edit'
    isLoadingDetail?: boolean
    initialVoucher?: Voucher | null
  }) => (
    <div data-testid={`${mode}-modal`}>
      {isOpen ? 'open' : 'closed'}|{isLoadingDetail ? 'loading' : 'idle'}|{initialVoucher?.id ?? 'none'}
    </div>
  ),
}))

jest.mock('src/components/vouchers/voucher-detail-modal', () => ({
  VoucherDetailModal: ({
    voucherId,
    voucher,
    error,
    isLoading,
    onLoadError,
  }: {
    voucherId: string | null
    voucher?: Voucher
    error?: unknown
    isLoading?: boolean
    onLoadError: (error: unknown) => void
  }) => {
    useEffect(() => {
      if (!error) {
        return
      }
      onLoadError(error)
    }, [error, onLoadError])

    if (!voucherId) {
      return null
    }

    if (isLoading || !voucher) {
      return <div data-testid="edit-modal">open|loading|none</div>
    }

    return (
      <div data-testid="edit-modal">
        open|idle|{voucher.id ?? 'none'}
      </div>
    )
  },
}))

jest.mock('src/components/vouchers/voucher-delete-dialog', () => ({
  VoucherDeleteDialog: ({
    isOpen,
    voucher,
    onConfirm,
  }: {
    isOpen: boolean
    voucher: Voucher | null
    onConfirm: () => void
  }) =>
    isOpen ? (
      <div data-testid="delete-dialog">
        <span>{voucher?.id}</span>
        <button type="button" onClick={onConfirm}>
          Confirmar eliminación
        </button>
      </div>
    ) : null,
}))

function createBaseFormValues(): VoucherFormValues {
  return {
    date: '2026-08-08',
    voucherTypeId: '123e4567-e89b-12d3-a456-426614174000',
    voucherLetterId: '123e4567-e89b-12d3-a456-426614174001',
    posNumber: '00001',
    number: '00000123',
    thirdPartyId: '123e4567-e89b-12d3-a456-426614174002',
    thirdPartyCuit: '30-11111111-9',
    currency: '$',
    exchangeRate: 1,
    subtotal: 100,
    vatAmount: 21,
    nonTaxableAmount: 0,
    exemptAmount: 0,
    otherTaxesAmount: 0,
    totalAmount: 121,
    concept: '',
    paymentMethod: 'Transferencia',
    status: 'pending',
    paymentDate: '',
    paidAmount: 0,
    comments: '',
    createdByUserId: '123e4567-e89b-12d3-a456-426614174099',
    retentions: [],
    perceptions: [{ perceptionConceptId: '', taxJurisdictionId: '', amount: 0 }],
  }
}

function createVoucherFormOptions() {
  return {
    catalogs: {
      voucherTypes: [],
      voucherLetters: [],
      retentionConcepts: [],
      perceptionConcepts: [{ id: '123e4567-e89b-12d3-a456-426614174016', name: 'Percepción de Ingresos Brutos' }],
      taxJurisdictions: [{ id: '123e4567-e89b-12d3-a456-426614174017', name: 'CABA' }],
    },
    thirdParties: [{ id: '123e4567-e89b-12d3-a456-426614174014', name: 'Proveedor Uno', cuit: '30-22222222-3' }],
  }
}

function PerceptionsHarness() {
  const form = useForm<VoucherFormValues>({
    defaultValues: createBaseFormValues(),
  })
  const fieldArray = useFieldArray({
    control: form.control,
    name: 'perceptions',
  })

  return (
    <VoucherModalPerceptions
      form={form}
      fields={fieldArray.fields}
      append={fieldArray.append}
      remove={fieldArray.remove}
      catalogs={{
        perceptionConcepts: [
          { id: 'per-iibb', name: 'Percepción de Ingresos Brutos' },
          { id: 'per-iva', name: 'Percepción de IVA' },
        ],
        taxJurisdictions: [
          { id: 'jur-caba', name: 'CABA' },
          { id: 'jur-pba', name: 'Buenos Aires' },
        ],
      }}
    />
  )
}

function createVoucher(overrides: Record<string, unknown> = {}) {
  return new Voucher({
    id: '123e4567-e89b-12d3-a456-426614174010',
    companyId: '123e4567-e89b-12d3-a456-426614174011',
    type: 'purchase',
    voucherTypeId: '123e4567-e89b-12d3-a456-426614174012',
    voucherLetterId: '123e4567-e89b-12d3-a456-426614174013',
    posNumber: '00001',
    number: '00000123',
    supplierId: '123e4567-e89b-12d3-a456-426614174014',
    date: new Date('2026-08-08T00:00:00.000Z'),
    accountingPeriod: new Date('2026-08-01T00:00:00.000Z'),
    currency: '$',
    exchangeRate: 1,
    subtotal: 100,
    vatAmount: 21,
    nonTaxableAmount: 0,
    exemptAmount: 0,
    otherTaxesAmount: 0,
    totalAmount: 136,
    netAmount: 136,
    concept: 'Servicios',
    paymentMethod: 'Transferencia',
    status: 'partial',
    paymentDate: new Date('2026-08-10T00:00:00.000Z'),
    paidAmount: 50,
    comments: 'Observación breve',
    createdByUserId: '123e4567-e89b-12d3-a456-426614174015',
    retentions: [],
    perceptions: [
      {
        perceptionConceptId: '123e4567-e89b-12d3-a456-426614174016',
        taxJurisdictionId: '123e4567-e89b-12d3-a456-426614174017',
        amount: 15,
        perceptionConcept: { id: '123e4567-e89b-12d3-a456-426614174016', name: 'Percepción de Ingresos Brutos' },
        taxJurisdiction: { id: '123e4567-e89b-12d3-a456-426614174017', name: 'CABA' },
      },
    ],
    vatDetails: [],
    voucherLetter: { letter: 'A' },
    supplier: { name: 'Proveedor Uno', cuit: '30-22222222-3' },
    ...overrides,
  })
}

function createVoucherListResponse(vouchers: Voucher[]): VoucherListResponse {
  return {
    items: vouchers.map((voucher) => ({
      rowKey: voucher.id || `${voucher.posNumber}-${voucher.number}`,
      voucher,
      composedVoucherId: `${voucher.posNumber}-${voucher.number}`,
      partyName: voucher.client?.name || voucher.supplier?.name || null,
      partyCuit: voucher.client?.cuit || voucher.supplier?.cuit || null,
    })),
    page: 1,
    pageSize: 10,
    total: vouchers.length,
    totalPages: 1,
  }
}

function createVoucherSummaryResponse(): VoucherSummaryResponse {
  return {
    totalCount: 1,
    totalAmount: 136,
    topPartyName: 'Proveedor Uno',
  }
}

describe('Voucher UI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    searchParamsState.value = ''
    useVouchersMock.mockReturnValue({ data: createVoucherListResponse([]), isLoading: false, mutate: jest.fn() })
    useVoucherSummaryMock.mockReturnValue({ data: createVoucherSummaryResponse(), isLoading: false, mutate: jest.fn() })
    useVoucherByIdMock.mockReturnValue({ data: undefined, isLoading: false, error: undefined, mutate: jest.fn() })
  })

  it('shows a jurisdiction select for IIBB perceptions', async () => {
    render(<PerceptionsHarness />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'per-iibb' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')).toHaveLength(2)
    })

    expect(screen.getByRole('option', { name: 'CABA' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Buenos Aires' })).toBeInTheDocument()
  })

  it('renders the compact purchases grid and exposes detail and delete actions per row', () => {
    const onAdd = jest.fn()
    const onSelectVoucher = jest.fn()
    const onDeleteVoucher = jest.fn()
    const voucher = createVoucher()

    render(
      <RealVoucherTable
        data={createVoucherListResponse([voucher])}
        query={{ page: 1, pageSize: 10, sortBy: 'date', sortOrder: 'desc', voucherId: null }}
        searchValue=""
        type="purchases"
        onAdd={onAdd}
        onSelectVoucher={onSelectVoucher}
        onDeleteVoucher={onDeleteVoucher}
        onSearchChange={jest.fn()}
        onClearFilters={jest.fn()}
        onStatusChange={jest.fn()}
        onDateRangeChange={jest.fn()}
        onSortChange={jest.fn()}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    )

    expect(screen.getByText('Letra')).toBeInTheDocument()
    expect(screen.getAllByText('Comprobante')[0]).toBeInTheDocument()
    expect(screen.getByText('Concepto')).toBeInTheDocument()
    expect(screen.getByText('Medio Pago')).toBeInTheDocument()
    expect(screen.getByText('T/C')).toBeInTheDocument()
    expect(screen.getByText('Percepciones')).toBeInTheDocument()
    expect(screen.getByText(/15,00/)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Mostrar comprobantes por página' })).toHaveValue('10')

    fireEvent.click(screen.getByRole('button', { name: '00001-00000123' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar comprobante' }))

    expect(onSelectVoucher).toHaveBeenCalledWith(voucher)
    expect(onDeleteVoucher).toHaveBeenCalledWith(voucher)
  })

  it('forwards voucher search input changes immediately to the hook layer', () => {
    const onSearchChange = jest.fn()
    const voucher = createVoucher()

    render(
      <RealVoucherTable
        data={createVoucherListResponse([voucher])}
        query={{ page: 1, pageSize: 10, sortBy: 'date', sortOrder: 'desc', voucherId: null }}
        searchValue=""
        type="purchases"
        onAdd={jest.fn()}
        onSelectVoucher={jest.fn()}
        onDeleteVoucher={jest.fn()}
        onSearchChange={onSearchChange}
        onClearFilters={jest.fn()}
        onStatusChange={jest.fn()}
        onDateRangeChange={jest.fn()}
        onSortChange={jest.fn()}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre, CUIT...'), { target: { value: 'Proveedor' } })

    expect(onSearchChange).toHaveBeenCalledWith('Proveedor')
  })

  it('applies date filters only when both dates are present', async () => {
    const onDateRangeChange = jest.fn()
    const voucher = createVoucher()
    const { container } = render(
      <RealVoucherTable
        data={createVoucherListResponse([voucher])}
        query={{ page: 1, pageSize: 10, sortBy: 'date', sortOrder: 'desc', voucherId: null }}
        searchValue=""
        type="purchases"
        onAdd={jest.fn()}
        onSelectVoucher={jest.fn()}
        onDeleteVoucher={jest.fn()}
        onSearchChange={jest.fn()}
        onClearFilters={jest.fn()}
        onStatusChange={jest.fn()}
        onDateRangeChange={onDateRangeChange}
        onSortChange={jest.fn()}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    )

    const [dateFromInput, dateToInput] = Array.from(container.querySelectorAll('input[type="date"]'))

    fireEvent.change(dateFromInput, { target: { value: '2026-08-01' } })

    expect(onDateRangeChange).not.toHaveBeenCalled()

    fireEvent.change(dateToInput, { target: { value: '2026-08-14' } })

    await waitFor(() => {
      expect(onDateRangeChange).toHaveBeenCalledWith('2026-08-01', '2026-08-14')
    })
  })

  it('shows direct page shortcuts for pagination jumps', () => {
    const onPageChange = jest.fn()
    const voucher = createVoucher()

    render(
      <RealVoucherTable
        data={{
          ...createVoucherListResponse([voucher]),
          page: 5,
          pageSize: 10,
          total: 120,
          totalPages: 12,
        }}
        query={{ page: 5, pageSize: 10, sortBy: 'date', sortOrder: 'desc', voucherId: null }}
        searchValue=""
        type="purchases"
        onAdd={jest.fn()}
        onSelectVoucher={jest.fn()}
        onDeleteVoucher={jest.fn()}
        onSearchChange={jest.fn()}
        onClearFilters={jest.fn()}
        onStatusChange={jest.fn()}
        onDateRangeChange={jest.fn()}
        onSortChange={jest.fn()}
        onPageChange={onPageChange}
        onPageSizeChange={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '12' }))

    expect(onPageChange).toHaveBeenCalledWith(1)
    expect(onPageChange).toHaveBeenCalledWith(12)
  })

  it('persists voucher creation and closes the modal on success', async () => {
    const onOpenChange = jest.fn()
    const onSuccess = jest.fn()

    apiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/catalogs') {
        return Promise.resolve({
          json: async () => ({
            voucherTypes: [],
            voucherLetters: [],
            retentionConcepts: [],
            perceptionConcepts: [],
            taxJurisdictions: [],
          }),
        })
      }

      if (path === '/api/suppliers') {
        return Promise.resolve({
          json: async () => [],
        })
      }

      return Promise.resolve({
        json: async () => ({
          id: 'saved-voucher-id',
          companyId: '123e4567-e89b-12d3-a456-426614174011',
          type: 'purchase',
          voucherTypeId: '123e4567-e89b-12d3-a456-426614174000',
          voucherLetterId: '123e4567-e89b-12d3-a456-426614174001',
          posNumber: '00001',
          number: '00000123',
          supplierId: '123e4567-e89b-12d3-a456-426614174002',
          date: '2026-08-08T00:00:00.000Z',
          accountingPeriod: '2026-08-01T00:00:00.000Z',
          currency: '$',
          exchangeRate: 1,
          subtotal: 100,
          vatAmount: 21,
          nonTaxableAmount: 0,
          exemptAmount: 0,
          otherTaxesAmount: 0,
          totalAmount: 121,
          netAmount: 121,
          paymentMethod: 'Transferencia',
          status: 'pending',
          paidAmount: 0,
          createdByUserId: '123e4567-e89b-12d3-a456-426614174099',
          retentions: [],
          perceptions: [],
          vatDetails: [],
        }),
      })
    })

    const { result } = renderHook(() =>
      useVoucherForm({
        isOpen: true,
        onOpenChange,
        type: 'purchases',
        mode: 'create',
        ...createVoucherFormOptions(),
        onSuccess,
      })
    )

    await act(async () => {
      await result.current.onSubmit(createBaseFormValues())
    })

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/vouchers',
      expect.objectContaining({
        method: 'POST',
      })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalledWith(expect.any(Voucher), 'create')
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Comprobante guardado',
      })
    )
  })

  it('persists voucher edition through the API and keeps the modal open', async () => {
    const initialVoucher = createVoucher()
    const onOpenChange = jest.fn()
    const onSuccess = jest.fn()

    apiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/catalogs') {
        return Promise.resolve({
          json: async () => ({
            voucherTypes: [],
            voucherLetters: [],
            retentionConcepts: [],
            perceptionConcepts: [{ id: '123e4567-e89b-12d3-a456-426614174016', name: 'Percepción de Ingresos Brutos' }],
            taxJurisdictions: [{ id: '123e4567-e89b-12d3-a456-426614174017', name: 'CABA' }],
          }),
        })
      }

      if (path === '/api/suppliers') {
        return Promise.resolve({
          json: async () => [{ id: '123e4567-e89b-12d3-a456-426614174014', name: 'Proveedor Uno', cuit: '30-22222222-3' }],
        })
      }

      return Promise.resolve({
        json: async () => ({
          ...initialVoucher,
          comments: 'Editado y persistido',
        }),
      })
    })

    const { result } = renderHook(() =>
      useVoucherForm({
        isOpen: true,
        onOpenChange,
        type: 'purchases',
        mode: 'edit',
        ...createVoucherFormOptions(),
        initialVoucher,
        onSuccess,
      })
    )

    const editedValues = {
      ...createBaseFormValues(),
      comments: 'Editado y persistido',
    }

    await act(async () => {
      await result.current.onSubmit(editedValues)
    })

    expect(apiRequestMock).toHaveBeenCalledWith(
      `/api/vouchers/${initialVoucher.id}`,
      expect.objectContaining({
        method: 'PUT',
      })
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalledWith(expect.any(Voucher), 'edit')
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Comprobante actualizado',
      })
    )
  })

  it('shows the modal loader while the voucher detail is loading', () => {
    const { VoucherModal } = jest.requireActual('src/components/vouchers/voucher-modal') as {
      VoucherModal: typeof import('src/components/vouchers/voucher-modal').VoucherModal
    }

    render(
      <VoucherModal
        isOpen
        onOpenChange={jest.fn()}
        type="sales"
        mode="edit"
        isLoadingDetail
      />
    )

    expect(screen.getByText('Cargando comprobante')).toBeInTheDocument()
    expect(screen.getByText('Estamos trayendo la información para editarla.')).toBeInTheDocument()
  })

  it('opens the edit modal from voucherId and hydrates the selected voucher when the request finishes', async () => {
    const voucher = createVoucher({ id: 'voucher-detail-id' })

    searchParamsState.value = 'voucherId=voucher-detail-id'
    useVouchersMock.mockReturnValue({ data: createVoucherListResponse([voucher]), isLoading: false, mutate: jest.fn() })
    useVoucherByIdMock.mockReturnValue({ data: voucher, isLoading: false, error: undefined, mutate: jest.fn() })

    render(
      <VoucherManagementView
        type="sales"
        title="Ventas"
        description="Gestión"
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('edit-modal')).toHaveTextContent('open|idle|voucher-detail-id')
    })
  })

  it('shows an error toast and clears the voucherId query param when detail fetch fails', async () => {
    searchParamsState.value = 'voucherId=missing-voucher-id'
    useVouchersMock.mockReturnValue({ data: createVoucherListResponse([]), isLoading: false, mutate: jest.fn() })
    useVoucherByIdMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiRequestError('Comprobante no existe.', 404, { error: 'Comprobante no existe.' }),
      mutate: jest.fn(),
    })

    render(
      <VoucherManagementView
        type="sales"
        title="Ventas"
        description="Gestión"
      />
    )

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Comprobante no disponible',
          description: 'Comprobante no existe.',
        })
      )
    })

    expect(replaceMock).toHaveBeenCalledWith('/sales', { scroll: false })
  })

  it('confirms physical deletion, refreshes the table, shows success feedback, and clears voucherId when needed', async () => {
    const voucher = createVoucher({ id: 'voucher-delete-id' })

    searchParamsState.value = 'voucherId=voucher-delete-id'
    useVouchersMock.mockReturnValue({ data: createVoucherListResponse([voucher]), isLoading: false, mutate: jest.fn() })
    useVoucherByIdMock.mockReturnValue({ data: voucher, isLoading: false, error: undefined, mutate: jest.fn() })
    apiRequestMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/api/vouchers/voucher-delete-id' && options?.method === 'DELETE') {
        return Promise.resolve({
          json: async () => ({}),
        })
      }

      return Promise.resolve({
        json: async () => voucher,
      })
    })

    render(
      <VoucherManagementView
        type="purchases"
        title="Compras"
        description="Gestión"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Eliminar voucher-delete-id' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar voucher-delete-id' }))

    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith('/api/vouchers/voucher-delete-id', { method: 'DELETE' })
    })

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Comprobante eliminado',
      })
    )
    expect(replaceMock).toHaveBeenCalledWith('/sales', { scroll: false })
  })
})
