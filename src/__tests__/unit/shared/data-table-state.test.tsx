/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { DataTableState } from "src/components/ui/data-table-state";

describe("DataTableState", () => {
  it("renders a reusable error message and recovery action", () => {
    const onRetry = jest.fn();
    render(<DataTableState variant="error" message="No se pudo cargar la información." actionLabel="Reintentar" onAction={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByText("No se pudo cargar la información.")).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
