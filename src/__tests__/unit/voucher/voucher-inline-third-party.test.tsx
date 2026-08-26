/** @jest-environment jsdom */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { ConciliationReviewPreview } from "src/components/conciliations/conciliation-review-preview"
import { VoucherModalReady } from "src/components/vouchers/voucher-modal"
import { ApiRequestError } from "src/lib/api/api-client"

const toastAdd = jest.fn()
const apiRequestMock = jest.fn()

jest.mock("src/components/ui/toast", () => ({
  useToastManager: () => ({ add: toastAdd }),
}))

jest.mock("src/hooks/auth/use-auth", () => ({
  useAuth: () => ({
    user: { id: "123e4567-e89b-12d3-a456-426614174099" },
  }),
}))

jest.mock("src/components/conciliations/conciliation-review-preview", () => ({
  ConciliationReviewPreview: () => <div data-testid="conciliation-review-preview" />,
}))

jest.mock("src/lib/api/api-client", () => ({
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

function createCatalogsResponse() {
  return {
    voucherTypes: [{ id: "type-1", name: "Factura" }],
    voucherLetters: [{ id: "letter-a", letter: "A" }],
    retentionConcepts: [],
    perceptionConcepts: [],
    taxJurisdictions: [],
  }
}

function createParsedPayload(overrides: Record<string, unknown> = {}) {
  return {
    posNumber: "1",
    number: "123",
    date: "2026-08-25",
    currency: "$",
    exchangeRate: 1,
    subtotal: 100,
    vatAmount: 21,
    nonTaxableAmount: 0,
    exemptAmount: 0,
    otherTaxesAmount: 0,
    totalAmount: 121,
    concept: "Servicios",
    paymentMethod: "Transferencia",
    status: "pending",
    paymentDate: null,
    paidAmount: 0,
    comments: null,
    thirdPartyCuit: "30-11111111-9",
    thirdPartyName: "Proveedor IA",
    voucherType: "Factura",
    voucherLetter: "A",
    vatDetails: [],
    retentions: [],
    perceptions: [],
    thirdPartyId: null,
    ...overrides,
  }
}

function createCreatedSupplier() {
  return {
    id: "supplier-1",
    name: "Proveedor IA",
    cuit: "30-11111111-9",
  }
}

function createVoucherModalOptions(initialThirdParties: Array<{ id: string; name: string; cuit: string }> = []) {
  return {
    catalogs: createCatalogsResponse(),
    thirdParties: initialThirdParties,
  }
}

describe("Voucher inline third-party creation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    URL.createObjectURL = jest.fn(() => "blob:voucher-preview")
    URL.revokeObjectURL = jest.fn()
  })

  it("prefills the inline supplier modal from parsed values and auto-selects the created record", async () => {
    const onOpenChange = jest.fn()
    const createdSupplier = createCreatedSupplier()
    let supplierListResponse: Array<{ id: string; name: string; cuit: string }> = []

    apiRequestMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path === "/api/catalogs") {
        return Promise.resolve({ json: async () => createCatalogsResponse() })
      }

      if (path === "/api/suppliers" && !options?.method) {
        return Promise.resolve({ json: async () => supplierListResponse })
      }

      if (path === "/api/suppliers" && options?.method === "POST") {
        supplierListResponse = [createdSupplier]
        return Promise.resolve({ json: async () => createdSupplier })
      }

      return Promise.reject(new Error(`Unhandled request: ${path}`))
    })

    render(
      <VoucherModalReady
        isOpen
        onOpenChange={onOpenChange}
        type="purchases"
        mode="create"
        initialParsedData={createParsedPayload()}
        options={createVoucherModalOptions()}
      />
    )

    const openInlineButton = await screen.findByRole("button", { name: "Agregar proveedor" })

    fireEvent.click(openInlineButton)

    expect(await screen.findByLabelText("Nombre")).toHaveValue("Proveedor IA")
    expect(screen.getByLabelText("CUIT")).toHaveValue("30-11111111-9")

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))

    await waitFor(() => {
      expect((screen.getByRole("option", { name: "Proveedor IA" }) as HTMLOptionElement).selected).toBe(true)
    })

    expect(screen.getByDisplayValue("30-11111111-9")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Agregar proveedor" })).not.toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("hides the inline supplier action when the parsed supplier is already resolved in the select", () => {
    render(
      <VoucherModalReady
        isOpen
        onOpenChange={jest.fn()}
        type="purchases"
        mode="create"
        initialParsedData={createParsedPayload()}
        options={createVoucherModalOptions([createCreatedSupplier()])}
      />
    )

    expect(screen.queryByRole("button", { name: "Agregar proveedor" })).not.toBeInTheDocument()
  })

  it("resolves an existing supplier on duplicate create without showing an error toast", async () => {
    const existingSupplier = createCreatedSupplier()

    apiRequestMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path === "/api/catalogs") {
        return Promise.resolve({ json: async () => createCatalogsResponse() })
      }

      if (path === "/api/suppliers" && !options?.method) {
        return Promise.resolve({ json: async () => [] })
      }

      if (path === "/api/suppliers" && options?.method === "POST") {
        return Promise.reject(new ApiRequestError("El proveedor ya existe", 409, { error: "El proveedor ya existe" }))
      }

      if (path.includes("/api/suppliers?") && path.includes("search=Proveedor")) {
        return Promise.resolve({
          json: async () => ({
            items: [existingSupplier],
            page: 1,
            pageSize: 50,
            total: 1,
            totalPages: 1,
          }),
        })
      }

      return Promise.reject(new Error(`Unhandled request: ${path}`))
    })

    render(
      <VoucherModalReady
        isOpen
        onOpenChange={jest.fn()}
        type="purchases"
        mode="create"
        initialParsedData={createParsedPayload()}
        options={createVoucherModalOptions()}
      />
    )

    fireEvent.click(await screen.findByRole("button", { name: "Agregar proveedor" }))
    fireEvent.click(await screen.findByRole("button", { name: "Guardar" }))

    await waitFor(() => {
      expect((screen.getByRole("option", { name: "Proveedor IA" }) as HTMLOptionElement).selected).toBe(true)
    })

    expect(toastAdd).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "No se pudo guardar",
      })
    )
  })

  it("exposes the inline client creation action in the shared review configuration used by conciliation", async () => {
    render(
      <VoucherModalReady
        isOpen
        type="sales"
        onOpenChange={jest.fn()}
        mode="create"
        initialParsedData={createParsedPayload({
          thirdPartyName: "Cliente IA",
          thirdPartyCuit: "20-12345678-3",
        })}
        submitAction={jest.fn()}
        submitButtonLabel="Validar factura"
        titleOverride="Revisar factura"
        descriptionOverride="Revisa la factura de venta, comparala con el documento y validala."
        sidePanel={<ConciliationReviewPreview sourceUrl={null} mimeType={null} fileName={null} />}
        options={createVoucherModalOptions()}
      />
    )

    expect(await screen.findByRole("button", { name: "Agregar cliente" })).toBeInTheDocument()
  })

  it("prefills the inline supplier modal after parsing an individual voucher", async () => {
    const file = new File(["voucher"], "voucher.pdf", { type: "application/pdf" })

    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/api/vouchers/parse") {
        return Promise.resolve({
          json: async () => createParsedPayload({
            thirdPartyName: "Proveedor Individual",
            thirdPartyCuit: "30-22222222-3",
          }),
        })
      }

      return Promise.reject(new Error(`Unhandled request: ${path}`))
    })

    render(
      <VoucherModalReady
        isOpen
        onOpenChange={jest.fn()}
        type="purchases"
        mode="create"
        options={createVoucherModalOptions()}
      />
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(fileInput, {
        target: {
          files: [file],
        },
      })
    })

    fireEvent.click(await screen.findByRole("button", { name: "Agregar proveedor" }))

    expect(await screen.findByLabelText("Nombre")).toHaveValue("Proveedor Individual")
    expect(screen.getByLabelText("CUIT")).toHaveValue("30-22222222-3")
  })
})
