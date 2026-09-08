/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import { ClientsSuppliersManagementView } from "src/components/third-party/third-party-management-view"

const useManagementMock = jest.fn()

jest.mock("src/hooks/third-party/use-third-party-management", () => ({
  useClientsSuppliersManagement: () => useManagementMock(),
}))

jest.mock("src/components/third-party/third-party-management-header", () => ({
  ClientSupplierManagementHeader: () => <div data-testid="third-party-header" />,
}))

jest.mock("src/components/third-party/third-party-table", () => ({
  ClientSupplierTable: () => <div data-testid="third-party-table" />,
}))

jest.mock("src/components/third-party/third-party-management-overlays", () => ({
  ClientSupplierManagementOverlays: () => <div data-testid="third-party-overlays" />,
}))

jest.mock("src/components/third-party/third-party-skeleton", () => ({
  ClientSupplierSkeleton: () => <div data-testid="third-party-skeleton" />,
}))

function createManagementState(overrides: Record<string, unknown> = {}) {
  return {
    isCreateModalOpen: false,
    isDeleting: false,
    recordId: null,
    viewRecordId: null,
    recordPendingDelete: null,
    query: { page: 1, pageSize: 10, sortBy: "name", sortOrder: "asc", recordId: null },
    searchValue: "",
    data: undefined,
    isTableLoading: true,
    isTableValidating: false,
    tableError: undefined,
    recordDetail: undefined,
    recordDetailError: undefined,
    isRecordDetailLoading: false,
    openCreateModal: jest.fn(),
    handleCreateModalOpenChange: jest.fn(),
    handleEditModalOpenChange: jest.fn(),
    handleCreateSuccess: jest.fn(),
    handleEditSuccess: jest.fn(),
    handleDeleteRecord: jest.fn(),
    handleDeleteDialogOpenChange: jest.fn(),
    handleRecordDetailError: jest.fn(),
    handleSearchChange: jest.fn(),
    handleClearFilters: jest.fn(),
    handleSelectRecord: jest.fn(),
    handleSortChange: jest.fn(),
    handlePageChange: jest.fn(),
    handlePageSizeChange: jest.fn(),
    confirmRecordDelete: jest.fn(),
    goToClients: jest.fn(),
    goToSuppliers: jest.fn(),
    retryTable: jest.fn(),
    ...overrides,
  }
}

describe("ClientsSuppliersManagementView loading", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the skeleton while the first collection request has no data", () => {
    useManagementMock.mockReturnValue(createManagementState())

    render(<ClientsSuppliersManagementView type="clients" title="Clientes" description="Gestioná clientes" />)

    expect(screen.getByTestId("third-party-skeleton")).toBeInTheDocument()
    expect(screen.queryByTestId("third-party-table")).not.toBeInTheDocument()
  })

  it("renders cached data while it is being revalidated", () => {
    useManagementMock.mockReturnValue(createManagementState({
      data: { items: [{ id: "client-1" }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
      isTableLoading: false,
      isTableValidating: true,
    }))

    render(<ClientsSuppliersManagementView type="clients" title="Clientes" description="Gestioná clientes" />)

    expect(screen.getByTestId("third-party-table")).toBeInTheDocument()
    expect(screen.queryByTestId("third-party-skeleton")).not.toBeInTheDocument()
  })

  it("renders cached data while the requested page response is pending", () => {
    useManagementMock.mockReturnValue(createManagementState({
      data: { items: [{ id: "client-1" }], page: 1, pageSize: 10, total: 20, totalPages: 2 },
      query: { page: 2, pageSize: 10, sortBy: "name", sortOrder: "asc", recordId: null },
      isTableLoading: false,
      isTableValidating: false,
    }))

    render(<ClientsSuppliersManagementView type="clients" title="Clientes" description="GestionÃ¡ clientes" />)

    expect(screen.getByTestId("third-party-table")).toBeInTheDocument()
    expect(screen.queryByTestId("third-party-skeleton")).not.toBeInTheDocument()
  })

})
