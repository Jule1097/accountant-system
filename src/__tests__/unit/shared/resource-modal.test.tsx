/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { ResourceModal } from "src/components/ui/resource-modal";

describe("ResourceModal", () => {
  it("renders the shared shell with content, side panel, and footer slots", () => {
    render(
      <ResourceModal
        isOpen
        onOpenChange={jest.fn()}
        title="Editar registro"
        description="Actualiza la información del registro."
        sidePanel={<aside>Vista previa</aside>}
        footer={<button type="button">Guardar</button>}
        size="wide"
      >
        <div>Formulario</div>
      </ResourceModal>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Editar registro" })).toBeInTheDocument();
    expect(screen.getByText("Actualiza la información del registro.")).toBeInTheDocument();
    expect(screen.getByText("Formulario")).toBeInTheDocument();
    expect(screen.getByText("Vista previa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("renders the provided loading state instead of the content", () => {
    render(
      <ResourceModal
        isOpen
        isLoading
        onOpenChange={jest.fn()}
        title="Editar registro"
        loadingState={<span>Cargando registro</span>}
      >
        <div>Formulario</div>
      </ResourceModal>
    );

    expect(screen.getByText("Cargando registro")).toBeInTheDocument();
    expect(screen.queryByText("Formulario")).not.toBeInTheDocument();
  });
});
