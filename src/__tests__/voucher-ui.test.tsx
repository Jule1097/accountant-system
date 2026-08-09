/** @jest-environment jsdom */

import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useFieldArray, useForm } from 'react-hook-form'
import { VoucherModalPerceptions } from 'src/components/vouchers/voucher-modal-perceptions'
import { VoucherTable } from 'src/components/vouchers/voucher-table'
import { useVoucherForm, VoucherFormValues } from 'src/hooks/use-voucher-form'
import { Voucher } from 'src/models/Voucher'

const toastAdd = jest.fn()
const apiRequestMock = jest.fn()

jest.mock('src/components/ui/toast', () => ({
  useToastManager: () => ({ add: toastAdd }),
}))

jest.mock('src/lib/api-client', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
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
    retentions: [],
    perceptions: [{ perceptionConceptId: '', taxJurisdictionId: '', amount: 0 }],
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

describe('Voucher UI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  it('renders the compact purchases grid and opens voucher detail from the identifier', () => {
    const onAdd = jest.fn()
    const onSelectVoucher = jest.fn()
    const voucher = createVoucher()

    render(
      <VoucherTable
        data={[voucher]}
        type="purchases"
        onAdd={onAdd}
        onSelectVoucher={onSelectVoucher}
      />
    )

    expect(screen.getByText('Letra')).toBeInTheDocument()
    expect(screen.getByText('Comprobante')).toBeInTheDocument()
    expect(screen.getByText('Concepto')).toBeInTheDocument()
    expect(screen.getByText('Medio Pago')).toBeInTheDocument()
    expect(screen.getByText('Percepciones')).toBeInTheDocument()
    expect(screen.getByText(/15,00/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '00001-00000123' }))

    expect(onSelectVoucher).toHaveBeenCalledWith(voucher)
  })

  it('keeps voucher detail edits in local state and does not persist them yet', async () => {
    const initialVoucher = createVoucher()
    const onOpenChange = jest.fn()

    apiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/catalogs') {
        return Promise.resolve({
          json: async () => ({
            voucherTypes: [{ id: '123e4567-e89b-12d3-a456-426614174020', name: 'Factura' }],
            voucherLetters: [{ id: '123e4567-e89b-12d3-a456-426614174021', letter: 'A' }],
            retentionConcepts: [],
            perceptionConcepts: [{ id: '123e4567-e89b-12d3-a456-426614174016', name: 'Percepción de Ingresos Brutos' }],
            taxJurisdictions: [{ id: '123e4567-e89b-12d3-a456-426614174017', name: 'CABA' }],
          }),
        })
      }

      return Promise.resolve({
        json: async () => [{ id: '123e4567-e89b-12d3-a456-426614174014', name: 'Proveedor Uno', cuit: '30-22222222-3' }],
      })
    })

    const { result } = renderHook(() =>
      useVoucherForm({
        isOpen: true,
        onOpenChange,
        type: 'purchases',
        initialVoucher,
      })
    )

    await waitFor(() => {
      expect(result.current.catalogs.taxJurisdictions).toEqual([
        { id: '123e4567-e89b-12d3-a456-426614174017', name: 'CABA' },
      ])
    })

    expect(result.current.form.getValues('perceptions.0.taxJurisdictionId')).toBe('123e4567-e89b-12d3-a456-426614174017')

    act(() => {
      result.current.form.setValue('comments', 'Editado solo en UI')
      result.current.onSubmit()
    })

    expect(result.current.form.getValues('comments')).toBe('Editado solo en UI')
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        title: 'Edición en preparación',
      })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
