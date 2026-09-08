"use client";

import type { MouseEvent } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "src/components/ui/button";
import { getFormattedAmount, getFormattedDate } from "src/lib/helpers/platform/formatting";
import { getVoucherFormattedExchangeRate, getVoucherStatusBadgeClassName, getVoucherStatusLabel, getVoucherTaxTotal } from "src/lib/helpers/voucher/voucher-management";
import type { DataTableColumn } from "src/types/shared/data-table";
import type { VoucherApiResponse } from "src/types/voucher/voucher-api";
import type { VoucherListItem, VoucherScreenType } from "src/types/voucher/voucher";

interface VoucherTableColumnOptions {
  type: VoucherScreenType;
  onSelectVoucher: (voucher: VoucherApiResponse, action?: "view" | "edit") => void;
  onDeleteVoucher: (voucher: VoucherApiResponse) => void;
}

export function createVoucherTableColumns({
  type,
  onSelectVoucher,
  onDeleteVoucher,
}: VoucherTableColumnOptions): DataTableColumn<VoucherListItem>[] {
  return [
    {
      id: "date",
      header: "Fecha",
      accessor: (row) => getFormattedDate(row.voucher.date),
    },
    {
      id: "letter",
      header: "Letra",
      accessor: (row) => row.voucher.voucherLetter?.letter || "—",
    },
    {
      id: "voucher",
      header: "Comprobante",
      accessor: (row) => `${row.voucher.posNumber}-${row.voucher.number}`,
    },
    {
      id: "party",
      header: type === "sales" ? "Cliente" : "Proveedor",
      accessor: (row) => row.partyName || "—",
    },
    {
      id: "cuit",
      header: "CUIT",
      accessor: (row) => row.partyCuit || "—",
    },
    {
      id: "concept",
      header: "Concepto",
      accessor: (row) => row.voucher.concept || "—",
    },
    {
      id: "paymentMethod",
      header: "Medio Pago",
      accessor: (row) => row.voucher.paymentMethod || "—",
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${getVoucherStatusBadgeClassName(row.voucher.status)}`}>
          {getVoucherStatusLabel(row.voucher.status)}
        </span>
      ),
    },
    {
      id: "paymentDate",
      header: "F. Pago",
      accessor: (row) => getFormattedDate(row.voucher.paymentDate),
    },
    {
      id: "exchangeRate",
      header: "T/C",
      cellClassName: "text-right text-muted-foreground",
      cell: ({ row }) => getVoucherFormattedExchangeRate(Number(row.voucher.exchangeRate)),
    },
    {
      id: "taxes",
      header: type === "sales" ? "Retenciones" : "Percepciones",
      accessor: (row) => getFormattedAmount(row.voucher.currency, getVoucherTaxTotal(row.voucher, type)),
    },
    {
      id: "total",
      header: "Total",
      cellClassName: "text-right text-muted-foreground",
      accessor: (row) => getFormattedAmount(row.voucher.currency, Number(row.voucher.totalAmount)),
    },
    {
      id: "paid",
      header: "Pagado",
      cellClassName: "text-right text-muted-foreground",
      accessor: (row) => getFormattedAmount(row.voucher.currency, Number(row.voucher.paidAmount)),
    },
    {
      id: "balance",
      header: "Saldo",
      cellClassName: "text-right text-muted-foreground font-medium",
      accessor: (row) => getFormattedAmount(row.voucher.currency, Number(row.voucher.saldo)),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-[#FF5C00]"
            aria-label="Ver detalle del comprobante"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onSelectVoucher(row.voucher, "view");
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-[#FF5C00]"
            aria-label="Editar comprobante"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onSelectVoucher(row.voucher, "edit");
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Eliminar comprobante"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onDeleteVoucher(row.voucher);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
