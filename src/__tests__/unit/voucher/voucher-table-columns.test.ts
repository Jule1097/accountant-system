import { createVoucherTableColumns } from "src/components/vouchers/voucher-table-columns";

describe("voucher table columns", () => {
  it("defines voucher-specific headers and keeps row actions configurable", () => {
    const onSelectVoucher = jest.fn();
    const onDeleteVoucher = jest.fn();
    const columns = createVoucherTableColumns({ type: "purchases", onSelectVoucher, onDeleteVoucher });

    expect(columns.map((column) => column.id)).toEqual(["date", "letter", "voucher", "party", "cuit", "concept", "paymentMethod", "status", "paymentDate", "exchangeRate", "taxes", "total", "paid", "balance", "actions"]);
    expect(columns.find((column) => column.id === "party")?.header).toBe("Proveedor");
    expect(columns.find((column) => column.id === "taxes")?.header).toBe("Percepciones");
  });
});
