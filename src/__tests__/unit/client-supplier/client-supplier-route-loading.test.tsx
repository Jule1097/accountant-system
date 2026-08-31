/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import { JSX } from "react/jsx-runtime"

const pendingPromise = new Promise(() => undefined)

function loadClientsPage() {
  jest.resetModules()
  jest.doMock("src/components/clients-suppliers/clients-view", () => ({
    ClientsView: () => {
      throw pendingPromise
    },
  }))
  jest.doMock("src/components/clients-suppliers/client-supplier-skeleton", () => ({
    ClientSupplierSkeleton: () => <div data-testid="client-supplier-route-skeleton">client-supplier-route-skeleton</div>,
  }))

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("src/app/(dashboard)/clients/page").default as () => JSX.Element
}

function loadSuppliersPage() {
  jest.resetModules()
  jest.doMock("src/components/clients-suppliers/suppliers-view", () => ({
    SuppliersView: () => {
      throw pendingPromise
    },
  }))
  jest.doMock("src/components/clients-suppliers/client-supplier-skeleton", () => ({
    ClientSupplierSkeleton: () => <div data-testid="client-supplier-route-skeleton">client-supplier-route-skeleton</div>,
  }))

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("src/app/(dashboard)/suppliers/page").default as () => JSX.Element
}

describe("client supplier route loading contract", () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("renders clients route fallback from the page suspense boundary", () => {
    const ClientsPage = loadClientsPage()

    render(<ClientsPage />)

    expect(screen.getByTestId("client-supplier-route-skeleton")).toBeInTheDocument()
  })

  it("renders suppliers route fallback from the page suspense boundary", () => {
    const SuppliersPage = loadSuppliersPage()

    render(<SuppliersPage />)

    expect(screen.getByTestId("client-supplier-route-skeleton")).toBeInTheDocument()
  })
})
