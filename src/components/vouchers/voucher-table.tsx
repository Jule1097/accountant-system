"use client";

import type { ChangeEvent, MouseEvent } from "react";
import { Download, Search, Trash2, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { PaginationControls } from "src/components/ui/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "src/components/ui/table";
import {
  buildVoucherPageLabel,
  getVoucherFormattedAmount,
  getVoucherFormattedDate,
  getVoucherSortValue,
  getVoucherStatusBadgeClassName,
  getVoucherStatusLabel,
  getVoucherTaxTotal,
  voucherPageSizeOptions,
} from "src/lib/helpers/voucher-management";
import type { Voucher } from "src/models/Voucher";
import type {
  VoucherListItem,
  VoucherListQueryState,
  VoucherListResponse,
  VoucherSortBy,
  VoucherSortOrder,
  VoucherScreenType,
  VoucherStatus,
} from "src/types/voucher";

type VoucherTableProps = {
  data?: VoucherListResponse;
  query: VoucherListQueryState;
  searchValue: string;
  type: VoucherScreenType;
  onAdd: () => void;
  onSelectVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (voucher: Voucher) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onStatusChange: (value: VoucherStatus | undefined) => void;
  onDateRangeChange: (dateFrom: string, dateTo: string) => void;
  onSortChange: (
    sortBy: VoucherSortBy | undefined,
    sortOrder: VoucherSortOrder | undefined,
  ) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function VoucherTable({
  data,
  query,
  searchValue,
  type,
  onAdd,
  onSelectVoucher,
  onDeleteVoucher,
  onSearchChange,
  onClearFilters,
  onStatusChange,
  onDateRangeChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: VoucherTableProps) {
  const dateDraftRef = useRef({
    dateFrom: query.dateFrom || "",
    dateTo: query.dateTo || "",
  });

  const vouchers: VoucherListItem[] = data?.items || [];
  const currentPage = data?.page || query.page || 1;
  const totalPages = data?.totalPages || 1;
  const hasActiveFilters = Boolean(
    query.search || query.status || query.dateFrom || query.dateTo,
  );
  const dateInputsKey = `${query.dateFrom || ""}-${query.dateTo || ""}`;

  const updateDateRange = (dateFrom: string, dateTo: string) => {
    dateDraftRef.current = { dateFrom, dateTo };

    if (!dateFrom && !dateTo) {
      onDateRangeChange("", "");
      return;
    }

    if (!dateFrom || !dateTo) {
      if (!query.dateFrom && !query.dateTo) {
        return;
      }

      onDateRangeChange("", "");
      return;
    }

    onDateRangeChange(dateFrom, dateTo);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-end md:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                placeholder="Buscar por nombre, CUIT..."
                className="h-9 border-[#2A2A2E] bg-[#141417] pl-9 text-sm text-[#FFFFFF] placeholder:text-[#4A4A4E] focus-visible:ring-[#FF5C00]"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onSearchChange(event.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Estado</label>
            <select
              className="flex h-9 w-full rounded-md border border-[#2A2A2E] bg-[#141417] px-3 py-2 text-sm text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5C00]"
              value={query.status || ""}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onStatusChange(event.target.value ? (event.target.value as VoucherStatus) : undefined)
              }
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pagado</option>
            </select>
          </div>

          <div key={dateInputsKey} className="contents">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Desde</label>
              <Input
                type="date"
                defaultValue={query.dateFrom || ""}
                className="h-9 border-[#2A2A2E] bg-[#141417] text-sm text-[#FFFFFF] focus-visible:ring-[#FF5C00]"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateDateRange(event.target.value, dateDraftRef.current.dateTo)
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Hasta</label>
              <Input
                type="date"
                defaultValue={query.dateTo || ""}
                className="h-9 border-[#2A2A2E] bg-[#141417] text-sm text-[#FFFFFF] focus-visible:ring-[#FF5C00]"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateDateRange(dateDraftRef.current.dateFrom, event.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:justify-end">
          {hasActiveFilters ? (
            <Button
              variant="outline"
              className="h-9 border-[#2A2A2E] bg-[#141417] px-3 text-[#FFFFFF] hover:bg-[#1A1A1D] hover:text-[#FFFFFF]"
              onClick={onClearFilters}
            >
              Borrar filtros
              <X className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-[12px] overflow-hidden bg-[#111113] border border-[#1F1F23]">
        <div className="flex flex-col gap-3 border-b border-[#1F1F23] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            {data?.total ?? 0} comprobantes encontrados
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <label className="text-sm text-muted-foreground" htmlFor="voucher-sort">
              Ordenar por
            </label>
            <select
              id="voucher-sort"
              className="flex h-9 rounded-md border border-[#2A2A2E] bg-[#141417] px-3 py-2 text-sm text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5C00]"
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
            <Button
              variant="outline"
              className="h-9 border-[#2A2A2E] bg-[#141417] px-3 text-[#FFFFFF] hover:bg-[#1A1A1D]"
              type="button"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button
              onClick={onAdd}
              className="h-9 bg-[#FF5C00] px-3 text-[#FFFFFF] hover:bg-[#FF8A4C]"
            >
              {`Agregar ${type === "sales" ? "Venta" : "Compra"}`}
            </Button>
          </div>
        </div>

        <Table className="text-[13px] text-[#FFFFFF]">
          <TableHeader className="bg-[#141417]">
            <TableRow className="border-b-[#1F1F23] hover:bg-transparent">
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">Fecha</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">Letra</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">Comprobante</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">{type === "sales" ? "Cliente" : "Proveedor"}</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">CUIT</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">Concepto</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">Medio Pago</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">Estado</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">F. Pago</TableHead>
              <TableHead className="text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">{type === "sales" ? "Retenciones" : "Percepciones"}</TableHead>
              <TableHead className="text-right text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">Total</TableHead>
              <TableHead className="text-right text-[#6B6B70] font-semibold tracking-[0.5px] text-[11px]">Pagado</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.length === 0 ? (
              <TableRow className="border-b-[#1F1F23] bg-[#141417]">
                <TableCell colSpan={13} className="h-24 text-center text-[#6B6B70]">
                  No se encontraron comprobantes.
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((item) => (
                <TableRow
                  key={item.composedVoucherId}
                  className="bg-[#141417] border-b-[#1F1F23] hover:bg-[#1A1A1D] transition-colors"
                >
                  <TableCell className="text-[#6B6B70]">{getVoucherFormattedDate(item.voucher.date)}</TableCell>
                  <TableCell className="text-[#FFFFFF]">{item.voucher.voucherLetter?.letter || "—"}</TableCell>
                  <TableCell className="text-[#ADADB0]">
                    <button
                      type="button"
                      className="text-left font-medium text-[#FF5C00] hover:text-[#FF8A4C] underline-offset-4 hover:underline"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        onSelectVoucher(item.voucher);
                      }}
                    >
                      {`${item.voucher.posNumber}-${item.voucher.number}`}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium text-[#FFFFFF]">{item.partyName || "—"}</TableCell>
                  <TableCell className="text-[#6B6B70]">{item.partyCuit || "—"}</TableCell>
                  <TableCell className="text-[#ADADB0]">{item.voucher.concept || "—"}</TableCell>
                  <TableCell className="text-[#ADADB0]">{item.voucher.paymentMethod || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${getVoucherStatusBadgeClassName(item.voucher.status)}`}
                    >
                      {getVoucherStatusLabel(item.voucher.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#6B6B70]">{getVoucherFormattedDate(item.voucher.paymentDate)}</TableCell>
                  <TableCell className="text-[#ADADB0]">
                    {getVoucherFormattedAmount(
                      item.voucher.currency,
                      getVoucherTaxTotal(item.voucher, type),
                    )}
                  </TableCell>
                  <TableCell className="text-right text-[#ADADB0]">
                    {getVoucherFormattedAmount(item.voucher.currency, Number(item.voucher.totalAmount))}
                  </TableCell>
                  <TableCell className="text-right text-[#ADADB0]">
                    {getVoucherFormattedAmount(item.voucher.currency, Number(item.voucher.paidAmount))}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-[#6B6B70] hover:text-destructive hover:bg-destructive/10"
                      aria-label="Eliminar comprobante"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        onDeleteVoucher(item.voucher);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={query.pageSize}
          pageLabel={buildVoucherPageLabel(
            data || {
              items: [],
              total: 0,
              page: query.page,
              pageSize: query.pageSize,
              totalPages: 1,
            },
          )}
          pageSizeOptions={voucherPageSizeOptions}
          pageSizeAriaLabel="Mostrar comprobantes por página"
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}
