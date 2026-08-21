/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { LoginForm } from "src/components/auth/login-form";
import ConciliationsPage from "src/app/(dashboard)/conciliations/page";

const replaceMock = jest.fn();
const pushMock = jest.fn();
const handleTabChangeMock = jest.fn();
const handlePageChangeMock = jest.fn();
const handleReviewMock = jest.fn();
const handleRegenerateMock = jest.fn();
const handlePersistMock = jest.fn();
const handlePersistBatchMock = jest.fn();
const handleDeleteMock = jest.fn();
const handleDeleteSelectedMock = jest.fn();
const handleToggleItemSelectionMock = jest.fn();
const handleToggleAllDiscardableMock = jest.fn();
const handleReviewModalOpenChangeMock = jest.fn();
const handleReviewSubmitMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
}));

jest.mock("src/hooks/use-conciliations", () => ({
  useConciliations: () => ({
    batchId: "batch-42",
    activeTab: "sales",
    currentPage: 1,
    totalPages: 2,
    totalCount: 5,
    readyCount: 1,
    validatedCount: 1,
    persistBatchAction: {
      itemIds: ["item-validated"],
      selectedValidatedCount: 1,
      canPersist: true,
    },
    startIndex: 0,
    isPageLoading: false,
    isDeleting: false,
    deleteDialogState: {
      isOpen: false,
      title: "Eliminar factura",
      description: "Esta acción no se puede deshacer.",
      mode: null,
    },
    sections: [
      {
        key: "ready",
        title: "Listas para revisar",
        totalCount: 1,
        hasMore: false,
        items: [
          {
            id: "item-ready",
            batchId: "batch-42",
            type: "sales",
            documentId: "A 00001-00000075",
            date: "2026-08-16",
            thirdParty: "Acme Corp S.A.",
            amount: 150000,
            currency: "ARS",
            status: "Lista",
            message: "La factura está lista para revisión.",
            canReview: true,
            canRetry: false,
            canDiscard: true,
          },
        ],
      },
      {
        key: "validated",
        title: "Validadas",
        totalCount: 1,
        hasMore: false,
        items: [
          {
            id: "item-validated",
            batchId: "batch-42",
            type: "sales",
            documentId: "A 00001-00000076",
            date: "2026-08-16",
            thirdParty: "Globex S.A.",
            amount: 200000,
            currency: "ARS",
            status: "Validada",
            message: "La factura fue validada y está lista para persistirse.",
            canReview: false,
            canRetry: false,
            canDiscard: true,
          },
        ],
      },
      {
        key: "duplicate",
        title: "Duplicadas",
        totalCount: 1,
        hasMore: false,
        items: [
          {
            id: "item-duplicate",
            batchId: "batch-42",
            type: "sales",
            documentId: "A 00001-00000078",
            date: "2026-08-14",
            thirdParty: "Movistar Argentina",
            amount: 32000,
            currency: "ARS",
            status: "Duplicada",
            message: "La factura ya existe en la base de datos.",
            canReview: false,
            canRetry: false,
            canDiscard: true,
          },
        ],
      },
      {
        key: "error",
        title: "Error",
        totalCount: 1,
        hasMore: false,
        items: [
          {
            id: "item-error",
            batchId: "batch-42",
            type: "sales",
            documentId: "A 00001-00000077",
            date: "2026-08-15",
            thirdParty: "Pérez SRL",
            amount: 120000,
            currency: "ARS",
            status: "Error",
            message: "No se pudo procesar la factura.",
            canReview: false,
            canRetry: true,
            canDiscard: true,
          },
        ],
      },
    ],
    loadingVouchers: {},
    isReviewModalOpen: false,
    reviewItem: undefined,
    isReviewItemLoading: false,
    reviewSourceUrl: null,
    isVoucherSelected: (itemId: string) => itemId === "item-ready" || itemId === "item-validated",
    getSelectedCount: (itemIds: string[]) =>
      itemIds.filter((itemId) => itemId === "item-ready" || itemId === "item-validated").length,
    areAllSectionItemsSelected: () => false,
    handleTabChange: handleTabChangeMock,
    handlePageChange: handlePageChangeMock,
    handleToggleItemSelection: handleToggleItemSelectionMock,
    handleToggleAllDiscardable: handleToggleAllDiscardableMock,
    handleToggleVisibleSelection: handleToggleAllDiscardableMock,
    handleReview: handleReviewMock,
    handleReviewModalOpenChange: handleReviewModalOpenChangeMock,
    handleDeleteDialogOpenChange: jest.fn(),
    handleReviewSubmit: handleReviewSubmitMock,
    handleRegenerate: handleRegenerateMock,
    handlePersist: handlePersistMock,
    handlePersistBatch: handlePersistBatchMock,
    handleDelete: handleDeleteMock,
    handleDeleteSelected: handleDeleteSelectedMock,
    confirmDelete: jest.fn(),
    confirmDeleteSelected: jest.fn(),
  }),
}));

describe("Login Theme & Conciliations UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("applies light and dark responsive CSS theme classes on the Login Card", () => {
    render(<LoginForm />);
    const card = screen.getByText("Iniciar Sesión").closest('[data-slot="card"]');
    expect(card).toHaveClass("!bg-white");
    expect(card).toHaveClass("dark:!bg-zinc-950");
    expect(card).toHaveClass("border-zinc-200");
    expect(card).toHaveClass("dark:border-zinc-800");
  });

  it("renders sales conciliations with visible statuses and actions", async () => {
    render(<ConciliationsPage />);

    expect(await screen.findByText("Acme Corp S.A.")).toBeInTheDocument();
    expect(screen.getByText("Listas para revisar")).toBeInTheDocument();
    expect(screen.getByText("Validadas")).toBeInTheDocument();
    expect(screen.getByText("Duplicadas")).toBeInTheDocument();
    expect(screen.getByText("Lista")).toBeInTheDocument();
    expect(screen.getByText("Validada")).toBeInTheDocument();
    expect(screen.getByText("Duplicada")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revisar factura A 00001-00000075" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar factura A 00001-00000076" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Regenerar factura A 00001-00000077" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Eliminar factura/ })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: "Guardar seleccionadas (1)" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Eliminar seleccionadas (1)" })).toHaveLength(2);
    expect(screen.getByLabelText("Seleccionar facturas de Listas para revisar")).toBeInTheDocument();
  });

  it("calls tab change handler when clicking Compras", async () => {
    render(<ConciliationsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Compras" }));
    expect(handleTabChangeMock).toHaveBeenCalledWith("purchases");
  });

  it("calls page change handler when clicking page 2", async () => {
    render(<ConciliationsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "2" }));
    expect(handlePageChangeMock).toHaveBeenCalledWith(2);
  });

  it("calls review, persistence, retry and discard handlers", async () => {
    render(<ConciliationsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Revisar factura A 00001-00000075" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar factura A 00001-00000076" }));
    fireEvent.click(screen.getByRole("button", { name: "Regenerar factura A 00001-00000077" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar factura A 00001-00000078" }));

    expect(handleReviewMock).toHaveBeenCalledWith(expect.objectContaining({ id: "item-ready" }));
    expect(handlePersistMock).toHaveBeenCalledWith(expect.objectContaining({ id: "item-validated" }));
    expect(handleRegenerateMock).toHaveBeenCalledWith(expect.objectContaining({ id: "item-error" }));
    expect(handleDeleteMock).toHaveBeenCalledWith(expect.objectContaining({ id: "item-duplicate" }));
  });

  it("calls selection handlers for visible discard controls", async () => {
    render(<ConciliationsPage />);

    fireEvent.click(await screen.findByLabelText("Seleccionar facturas de Listas para revisar"));
    fireEvent.click(screen.getByLabelText("Seleccionar factura A 00001-00000075"));
    fireEvent.click(screen.getAllByRole("button", { name: "Eliminar seleccionadas (1)" })[0]);

    expect(handleToggleAllDiscardableMock).toHaveBeenCalledWith(["item-ready"], true);
    expect(handleToggleItemSelectionMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "item-ready" }),
      false
    );
    expect(handleDeleteSelectedMock).toHaveBeenCalled();
  });

  it("shows mass confirmation button for validated items and current batch", async () => {
    render(<ConciliationsPage />);

    fireEvent.click((await screen.findAllByRole("button", { name: "Guardar seleccionadas (1)" }))[0]);
    expect(handlePersistBatchMock).toHaveBeenCalled();
  });
});
