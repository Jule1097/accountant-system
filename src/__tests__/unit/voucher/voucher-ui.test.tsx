/** @jest-environment jsdom */

import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { VoucherManagementView } from 'src/components/vouchers/voucher-management-view'
import { VoucherModalPerceptions } from 'src/components/vouchers/voucher-modal-perceptions'
import { VoucherModalActions } from 'src/components/vouchers/voucher-modal-actions'
import { VoucherTableFilters } from 'src/components/vouchers/voucher-table-filters'
import { VoucherTableToolbar } from 'src/components/vouchers/voucher-table-toolbar'
import { useVoucherForm, VoucherFormValues } from 'src/hooks/voucher/use-voucher-form'
import { ApiRequestError } from 'src/lib/api/api-client'
import { ParsedVoucherData } from 'src/types/parser/gemini-parser'
import { VoucherApiResponse } from 'src/types/voucher/voucher-api'
import { VoucherListResponse, VoucherModalMode, VoucherSummaryResponse } from 'src/types/voucher/voucher'

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

jest.mock('src/lib/api/api-client', () => {
  class MockApiRequestError extends Error {
    status: number
    payload: unknown

    constructor(message: string, status: number, payload: unknown) {
      super(message)
      this.status = status
      this.payload = payload
    }
  }

  return {
    ApiRequestError: MockApiRequestError,
    isApiRequestError: (value: unknown) => value instanceof MockApiRequestError,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
    parseJsonResponse: async (response: Response) => response.json(),
  }
})

jest.mock('src/hooks/auth/use-auth', () => ({
  useAuth: () => ({
    user: { id: '123e4567-e89b-12d3-a456-426614174099' },
  }),
}))

jest.mock('src/contexts/company-context', () => ({
  useCompany: () => ({
    activeCompanyId: '123e4567-e89b-12d3-a456-426614174011',
  }),
}))

jest.mock('src/hooks/voucher/use-vouchers', () => ({
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
    onSelectVoucher: (voucher: VoucherApiResponse, action?: "view" | "edit") => void
    onDeleteVoucher: (voucher: VoucherApiResponse) => void
  }) => (
    <div data-testid="voucher-table-mock">
      <button type="button" onClick={onAdd}>
        Agregar
      </button>
      {data?.items?.map((item) => (
        <div key={item.voucher.id}>
          <button type="button" onClick={() => onSelectVoucher(item.voucher, "edit")}>
            Seleccionar {item.voucher.id}
          </button>
          <button type="button" onClick={() => onSelectVoucher(item.voucher, "view")}>
            Ver {item.voucher.id}
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
    mode: 'create' | 'edit' | 'view'
    isLoadingDetail?: boolean
    initialVoucher?: VoucherApiResponse | null
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
    mode,
    onLoadError,
  }: {
    voucherId: string | null
    voucher?: VoucherApiResponse
    error?: unknown
    isLoading?: boolean
    mode: VoucherModalMode
    onLoadError: (error: unknown) => void
  }) => {
    const [lastReportedId, setLastReportedId] = useState<string | null>(null)
    useEffect(() => {
      if (!voucherId || !error || lastReportedId === voucherId) {
        return
      }
      setLastReportedId(voucherId)
      onLoadError(error)
    }, [voucherId, error, onLoadError, lastReportedId])

    if (!voucherId) {
      return null
    }

    if (isLoading || !voucher) {
      return <div data-testid={`${mode}-modal`}>open|loading|none</div>
    }

    return (
      <div data-testid={`${mode}-modal`}>
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
    voucher: VoucherApiResponse | null
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

function createVoucher(overrides: Partial<VoucherApiResponse> = {}): VoucherApiResponse {
  return {
    id: '123e4567-e89b-12d3-a456-426614174010',
    companyId: '123e4567-e89b-12d3-a456-426614174011',
    type: 'purchase',
    voucherTypeId: '123e4567-e89b-12d3-a456-426614174012',
    voucherLetterId: '123e4567-e89b-12d3-a456-426614174013',
    posNumber: '00001',
    number: '00000123',
    supplierId: '123e4567-e89b-12d3-a456-426614174014',
    date: '2026-08-08T00:00:00.000Z',
    accountingPeriod: '2026-08-01T00:00:00.000Z',
    currency: 'ARS',
    exchangeRate: '1.0000',
    subtotal: '100.00',
    vatAmount: '21.00',
    nonTaxableAmount: '0.00',
    exemptAmount: '0.00',
    otherTaxesAmount: '0.00',
    totalAmount: '136.00',
    netAmount: '136.00',
    saldo: '86.00',
    concept: 'Servicios',
    paymentMethod: 'Transferencia',
    status: 'partial',
    paymentDate: '2026-08-10T00:00:00.000Z',
    paidAmount: '50.00',
    comments: 'Observación breve',
    createdByUserId: '123e4567-e89b-12d3-a456-426614174015',
    retentions: [],
    perceptions: [
      {
        perceptionConceptId: '123e4567-e89b-12d3-a456-426614174016',
        taxJurisdictionId: '123e4567-e89b-12d3-a456-426614174017',
        amount: '15.00',
        perceptionConcept: { id: '123e4567-e89b-12d3-a456-426614174016', name: 'Percepción de Ingresos Brutos' },
        taxJurisdiction: { id: '123e4567-e89b-12d3-a456-426614174017', name: 'CABA' },
      },
    ],
    vatDetails: [],
    clientId: null,
    client: null,
    voucherType: { name: 'Factura' },
    voucherLetter: { letter: 'A' },
    supplier: { name: 'Proveedor Uno', cuit: '30-22222222-3' },
    ...overrides,
  }
}

function createVoucherListResponse(vouchers: VoucherApiResponse[]): VoucherListResponse {
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
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:voucher-preview') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() })
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

  it('does not show a jurisdiction select for non-IIBB perceptions', async () => {
    render(<PerceptionsHarness />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'per-iva' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')).toHaveLength(1)
    })
  })

  it('formats perception amounts with localized decimals', () => {
    render(<PerceptionsHarness />)

    const amountInput = screen.getByDisplayValue('0,00')

    expect(amountInput).toHaveAttribute('type', 'text')
    expect(amountInput).toHaveAttribute('inputmode', 'decimal')

    fireEvent.change(amountInput, { target: { value: '200,50' } })
    fireEvent.blur(amountInput)

    expect(amountInput).toHaveValue('200,50')
  })

  it('renders voucher filters and forwards their changes', () => {
    jest.useFakeTimers()
    const onSearchChange = jest.fn()
    const onStatusChange = jest.fn()
    const onDateRangeChange = jest.fn()
    const onClearFilters = jest.fn()
    const { container } = render(
      <VoucherTableFilters
        query={{ page: 1, pageSize: 10, status: 'pending', dateFrom: '2026-08-01', dateTo: '2026-08-31' }}
        searchValue="Proveedor"
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
        onStatusChange={onStatusChange}
        onDateRangeChange={onDateRangeChange}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre, CUIT...'), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByDisplayValue('Pendiente'), { target: { value: 'paid' } })
    const [dateFromInput, dateToInput] = Array.from(container.querySelectorAll('input[type="date"]'))
    fireEvent.change(dateFromInput, { target: { value: '2026-08-02' } })
    fireEvent.change(dateToInput, { target: { value: '2026-08-30' } })
    jest.advanceTimersByTime(1500)
    fireEvent.click(screen.getByRole('button', { name: 'Borrar filtros' }))

    expect(onSearchChange).toHaveBeenCalledWith('Acme')
    expect(onStatusChange).toHaveBeenCalledWith('paid')
    expect(onDateRangeChange).toHaveBeenCalledWith('2026-08-02', '2026-08-30')
    expect(onClearFilters).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })

  it('renders table toolbar actions and forwards sorting changes', () => {
    const onAdd = jest.fn()
    const onSortChange = jest.fn()
    render(
      <VoucherTableToolbar
        total={4}
        query={{ page: 1, pageSize: 10, sortBy: 'date', sortOrder: 'desc', voucherId: null }}
        type="sales"
        onAdd={onAdd}
        onSortChange={onSortChange}
      />
    )

    fireEvent.change(screen.getByRole('combobox', { name: 'Ordenar por' }), { target: { value: 'status:asc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar Venta' }))

    expect(onSortChange).toHaveBeenCalledWith('status', 'asc')
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('renders mode-specific voucher modal actions', () => {
    const onClose = jest.fn()
    const { rerender } = render(<VoucherModalActions mode="view" isProcessing={false} isValid={true} primaryButtonLabel="Guardar" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(<VoucherModalActions mode="edit" isProcessing={true} isValid={false} primaryButtonLabel="Guardando cambios..." onClose={onClose} />)

    expect(screen.getByRole('button', { name: 'Guardando cambios...' })).toBeDisabled()
  })

  it('keeps the table skeleton visible while voucher data is loading', () => {
    useVouchersMock.mockReturnValue({ data: undefined, isLoading: true, mutate: jest.fn() })

    render(
      <VoucherManagementView
        type="sales"
        title="Ventas"
        description="GestiÃ³n"
      />
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByTestId('voucher-table-mock')).not.toBeInTheDocument()
  })

  it('opens voucher detail from the current table record without showing a detail loader', async () => {
    const voucher = createVoucher({ id: 'voucher-view-id' })
    useVouchersMock.mockReturnValue({ data: createVoucherListResponse([voucher]), isLoading: false, mutate: jest.fn() })

    render(
      <VoucherManagementView
        type="sales"
        title="Ventas"
        description="GestiÃ³n"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ver voucher-view-id' }))

    await waitFor(() => {
      expect(screen.getByTestId('view-modal')).toHaveTextContent('open|idle|voucher-view-id')
    })
    expect(useVoucherByIdMock).toHaveBeenLastCalledWith('')
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

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle del comprobante' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar comprobante' }))

    expect(onSelectVoucher).toHaveBeenCalledWith(voucher, 'view')
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
    jest.useFakeTimers()
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
    jest.advanceTimersByTime(1500)

    expect(onDateRangeChange).toHaveBeenCalledWith('2026-08-01', '2026-08-14')
    jest.useRealTimers()
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
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ type: 'purchase' }), 'create')
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Comprobante guardado',
      })
    )
  })

  it('shows parser validation messages returned by the API in the toast', async () => {
    apiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/catalogs') {
        return Promise.resolve({ json: async () => ({ voucherTypes: [], voucherLetters: [], retentionConcepts: [], perceptionConcepts: [], taxJurisdictions: [] }) })
      }

      if (path === '/api/suppliers') {
        return Promise.resolve({ json: async () => [] })
      }

      return Promise.reject(new ApiRequestError('El tamaño total de los archivos no puede superar los 24 MB.', 400, { error: 'El tamaño total de los archivos no puede superar los 24 MB.' }))
    })

    const { result } = renderHook(() => useVoucherForm({
      isOpen: true,
      onOpenChange: jest.fn(),
      type: 'purchases',
      mode: 'create',
      ...createVoucherFormOptions(),
      onSuccess: jest.fn(),
    }))

    const fileInput = document.createElement('input')
    Object.defineProperty(fileInput, 'files', { configurable: true, value: [new File(['invoice'], 'invoice.pdf', { type: 'application/pdf' })] })
    act(() => result.current.onFileChange({ target: fileInput } as React.ChangeEvent<HTMLInputElement>))

    await waitFor(() => expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      description: 'El tamaño total de los archivos no puede superar los 24 MB.',
    })))
  })

  it('hydrates batch review parsed data when it arrives after opening the form', async () => {
    const reviewOptions = {
      catalogs: {
        voucherTypes: [{ id: 'type-fce', name: 'Factura de Crédito Electrónica MiPyME' }],
        voucherLetters: [{ id: 'letter-a', letter: 'A' }],
        retentionConcepts: [],
        perceptionConcepts: [],
        taxJurisdictions: [],
      },
      thirdParties: [],
    }
    const baseProps = {
      isOpen: true,
      onOpenChange: jest.fn(),
      type: 'sales' as const,
      mode: 'create' as const,
      resetKey: 'batch-item-1',
      ...reviewOptions,
    } as Parameters<typeof useVoucherForm>[0]
    const parsedReviewData: ParsedVoucherData = {
      posNumber: '1',
      number: '123',
      date: '2026-08-08',
      currency: '$',
      exchangeRate: 1,
      subtotal: 100,
      vatAmount: 21,
      nonTaxableAmount: 0,
      exemptAmount: 0,
      otherTaxesAmount: 0,
      totalAmount: 121,
      concept: null,
      paymentMethod: null,
      status: null,
      paymentDate: null,
      paidAmount: null,
      comments: null,
      thirdPartyCuit: null,
      thirdPartyName: null,
      thirdPartyId: null,
      voucherType: 'Factura de Crédito Electrónica MiPyME (FCE)',
      voucherLetter: 'A',
      vatDetails: [],
      retentions: [],
      perceptions: [],
    }
    const { result, rerender } = renderHook((props: Parameters<typeof useVoucherForm>[0]) => useVoucherForm(props), {
      initialProps: {
        ...baseProps,
        initialParsedData: null,
      } as Parameters<typeof useVoucherForm>[0],
    })

    expect(result.current.form.getValues('voucherTypeId')).toBe('')
    expect(result.current.form.getValues('voucherLetterId')).toBe('')

    rerender({
      ...baseProps,
      initialParsedData: parsedReviewData,
    } as Parameters<typeof useVoucherForm>[0])

    await waitFor(() => {
      expect(result.current.form.getValues('voucherTypeId')).toBe('type-fce')
      expect(result.current.form.getValues('voucherLetterId')).toBe('letter-a')
    })
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
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ type: 'purchase' }), 'edit')
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
      expect(apiRequestMock).toHaveBeenCalledWith('/api/vouchers/voucher-delete-id', {
        method: 'DELETE',
        headers: { 'x-company-id': '123e4567-e89b-12d3-a456-426614174011' },
      })
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
