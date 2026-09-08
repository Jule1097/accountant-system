/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable } from "src/components/ui/data-table";
import { DataTableClearFiltersButton } from "src/components/ui/data-table-clear-filters-button";
import { DataTableDateRangeFilter } from "src/components/ui/data-table-date-range-filter";
import { DataTableFilterBar } from "src/components/ui/data-table-filter-bar";
import { DataTableSearchFilter } from "src/components/ui/data-table-search-filter";
import { DataTableSelectFilter } from "src/components/ui/data-table-select-filter";
import { DataTableToolbar } from "src/components/ui/data-table-toolbar";
import { PaginationControls } from "src/components/ui/pagination-controls";
import type { DataTableColumn } from "src/types/shared/data-table";

interface TestRow {
  id: string;
  name: string;
  amount: number;
  status: string;
}

const columns: DataTableColumn<TestRow>[] = [
  { id: "name", header: "Nombre", accessor: (row) => row.name },
  { id: "amount", header: "Importe", accessor: (row) => row.amount },
  { id: "status", header: "Estado", cell: ({ row }) => <strong>{row.status.toUpperCase()}</strong> },
];

const rows: TestRow[] = [{ id: "row-1", name: "Acme", amount: 120, status: "activo" }];

describe("DataTable", () => {
  it("renders typed columns, custom cells, stable row identities, and the footer slot", () => {
    render(<DataTable data={rows} columns={columns} getRowId={(row) => row.id} footer={<div>footer</div>} />);

    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Importe" })).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("ACTIVO")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Acme 120 ACTIVO/ })).toHaveAttribute("data-row-id", "row-1");
    expect(screen.getByText("footer")).toBeInTheDocument();
  });

  it("renders the configured loading and empty states", () => {
    const { rerender } = render(<DataTable data={[]} columns={columns} getRowId={(row) => row.id} isLoading loadingState={<span>Cargando</span>} emptyState={<span>Sin registros</span>} />);

    expect(screen.getByText("Cargando")).toBeInTheDocument();
    rerender(<DataTable data={[]} columns={columns} getRowId={(row) => row.id} emptyState={<span>Sin registros</span>} />);
    expect(screen.getByText("Sin registros")).toBeInTheDocument();
  });

  it("renders the configured error state before the empty state and retries through the provided action", () => {
    const onRetry = jest.fn();
    render(
      <DataTable
        data={[]}
        columns={columns}
        getRowId={(row) => row.id}
        errorState={<button type="button" onClick={onRetry}>Reintentar</button>}
        emptyState={<span>Sin registros</span>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Sin registros")).not.toBeInTheDocument();
  });

  it("composes toolbar and controlled filters without owning query state", () => {
    jest.useFakeTimers();
    const onSearchChange = jest.fn();
    const onStatusChange = jest.fn();
    const onDateRangeChange = jest.fn();
    const onClear = jest.fn();
    render(
      <>
        <DataTableToolbar summary={<span>2 registros</span>} actions={<button type="button">Agregar</button>} />
        <DataTableFilterBar>
          <DataTableSearchFilter id="search" label="Buscar" value="Acme" placeholder="Buscar registros" onChange={onSearchChange} />
          <DataTableSelectFilter id="status" label="Estado" value="pending" options={[{ value: "pending", label: "Pendiente" }, { value: "paid", label: "Pagado" }]} onChange={onStatusChange} />
          <DataTableDateRangeFilter id="date" from="2026-08-01" to="2026-08-31" onChange={onDateRangeChange} />
          <DataTableClearFiltersButton isVisible onClear={onClear} />
        </DataTableFilterBar>
      </>
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar" }), { target: { value: "Globex" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Estado" }), { target: { value: "paid" } });
    const [fromInput, toInput] = screen.getAllByDisplayValue(/2026-08/);
    fireEvent.change(fromInput, { target: { value: "2026-08-02" } });
    fireEvent.change(toInput, { target: { value: "2026-08-30" } });
    expect(onDateRangeChange).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1500);
    fireEvent.click(screen.getByRole("button", { name: "Borrar filtros" }));

    expect(onSearchChange).toHaveBeenCalledWith("Globex");
    expect(onStatusChange).toHaveBeenCalledWith("paid");
    expect(onDateRangeChange).toHaveBeenCalledWith("2026-08-02", "2026-08-30");
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByText("2 registros")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar" })).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("does not apply an incomplete date range", () => {
    jest.useFakeTimers();
    const onDateRangeChange = jest.fn();
    render(<DataTableDateRangeFilter id="date" onChange={onDateRangeChange} />);

    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-08-01" } });
    jest.advanceTimersByTime(1500);

    expect(onDateRangeChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-08-31" } });
    jest.advanceTimersByTime(1500);

    expect(onDateRangeChange).toHaveBeenCalledWith("2026-08-01", "2026-08-31");
    jest.useRealTimers();
  });

  it("forwards controlled pagination events", () => {
    const onPageChange = jest.fn();
    const onPageSizeChange = jest.fn();
    render(<PaginationControls currentPage={1} totalPages={3} pageSize={10} pageLabel="Página 1 de 3" pageSizeOptions={[10, 20]} pageSizeAriaLabel="Mostrar registros" onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Mostrar registros" }), { target: { value: "20" } });

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });
});
