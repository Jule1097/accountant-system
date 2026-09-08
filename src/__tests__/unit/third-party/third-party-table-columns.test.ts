import { createClientSupplierTableColumns } from "src/components/third-party/third-party-table-columns";

describe("client and supplier table columns", () => {
  it("defines shared third-party fields and configurable actions", () => {
    const onSelectRecord = jest.fn();
    const onDeleteRecord = jest.fn();
    const columns = createClientSupplierTableColumns({ type: "clients", onSelectRecord, onDeleteRecord });

    expect(columns.map((column) => column.id)).toEqual(["name", "cuit", "actions"]);
    expect(columns[0].header).toBe("Nombre");
    expect(columns[2].header).toBe("Acciones");
  });
});
