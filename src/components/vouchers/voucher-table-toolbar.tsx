"use client";

import type { ChangeEvent } from "react";
import { Button } from "src/components/ui/button";
import { DataTableToolbar } from "src/components/ui/data-table-toolbar";
import { VoucherExportButton } from "src/components/vouchers/voucher-export-button";
import { getVoucherSortValue } from "src/lib/helpers/voucher/voucher-management";
import type { VoucherListQueryState, VoucherScreenType, VoucherSortBy, VoucherSortOrder } from "src/types/voucher/voucher";

interface VoucherTableToolbarProps {
  total: number;
  query: VoucherListQueryState;
  type: VoucherScreenType;
  onAdd: () => void;
  onSortChange: (sortBy: VoucherSortBy | undefined, sortOrder: VoucherSortOrder | undefined) => void;
}

export function VoucherTableToolbar({
  total,
  query,
  type,
  onAdd,
  onSortChange,
}: VoucherTableToolbarProps) {
  return (
    <DataTableToolbar
      summary={<span>{total} comprobantes encontrados</span>}
      actions={
        <>
          <label className="text-sm text-muted-foreground" htmlFor="voucher-sort">
            Ordenar por
          </label>
          <select
            id="voucher-sort"
            className="flex h-9 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5C00]"
            value={getVoucherSortValue(query.sortBy, query.sortOrder)}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const [sortBy, sortOrder] = event.target.value.split(":");
              onSortChange(sortBy as VoucherSortBy, sortOrder as VoucherSortOrder);
            }}
          >
            <option value="date:desc">Fecha (más reciente)</option>
            <option value="date:asc">Fecha (más antigua)</option>
            <option value="status:asc">Estado</option>
            <option value="voucher:asc">Comprobante</option>
          </select>
          <VoucherExportButton type={type} query={query} />
          <Button
            onClick={onAdd}
            className="h-9 bg-[#FF5C00] px-3 text-[#FFFFFF] hover:bg-[#FF8A4C]"
          >
            {`Agregar ${type === "sales" ? "Venta" : "Compra"}`}
          </Button>
        </>
      }
    />
  );
}
