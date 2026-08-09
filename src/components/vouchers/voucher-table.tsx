"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "src/components/ui/table";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { MoreHorizontal, Search, X } from "lucide-react";
import { useState } from "react";
import { Voucher } from "src/models/Voucher";
import { useToastManager } from "src/components/ui/toast";

interface VoucherTableProps {
  data: Voucher[];
  type: "sales" | "purchases";
  onAdd: () => void;
  onSelectVoucher: (voucher: Voucher) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center rounded-full bg-[#22C55E18] px-2.5 py-1 text-[11px] font-medium text-[#22C55E]">
          Pagado
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex items-center rounded-full bg-[#EAB30818] px-2.5 py-1 text-[11px] font-medium text-[#EAB308]">
          Parcial
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center rounded-full bg-[#FF5C0018] px-2.5 py-1 text-[11px] font-medium text-[#FF5C00]">
          Pendiente
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-[#6B6B7018] px-2.5 py-1 text-[11px] font-medium text-[#6B6B70]">
          {status}
        </span>
      );
  }
}

function getFormattedAmount(currency: string, value: number) {
  const currencyLabel = currency === "USD" ? "USD" : "$";
  return `${currencyLabel} ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getFormattedDate(value?: Date | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

function getTaxTotal(voucher: Voucher, type: "sales" | "purchases") {
  const list = type === "sales" ? voucher.retentions : voucher.perceptions;
  return list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function VoucherTable({ data, type, onAdd, onSelectVoucher }: VoucherTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const toastManager = useToastManager();

  const filteredData = data.filter((item) => {
    const name = type === "sales" ? item.client?.name : item.supplier?.name;
    const cuit = type === "sales" ? item.client?.cuit : item.supplier?.cuit;

    return (
      (name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cuit || "").includes(searchTerm) ||
      `${item.posNumber}-${item.number}`.includes(searchTerm)
    );
  });

  const handleActionClick = (actionName: string) => {
    toastManager.add({
      type: "info",
      title: "Acción no disponible",
      description: `La acción de ${actionName} no está disponible en esta etapa.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B70]" />
            <Input
              placeholder="Buscar por nombre, CUIT o comprobante..."
              className="pl-9 bg-[#141417] border-[#2A2A2E] text-[#FFFFFF] placeholder:text-[#4A4A4E] focus-visible:ring-[#FF5C00]"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {searchTerm && (
            <Button variant="ghost" onClick={() => setSearchTerm("")} className="px-2 lg:px-3 text-[#6B6B70] hover:text-[#FFFFFF] hover:bg-[#1A1A1D]">
              Borrar filtros
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={onAdd} className="bg-[#FF5C00] hover:bg-[#FF8A4C] text-[#FFFFFF]">Agregar {type === "sales" ? "Venta" : "Compra"}</Button>
      </div>

      <div className="rounded-[12px] overflow-hidden bg-[#111113] border border-[#1F1F23]">
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
            {filteredData.length === 0 ? (
              <TableRow className="border-b-[#1F1F23] bg-[#141417]">
                <TableCell colSpan={14} className="h-24 text-center text-[#6B6B70]">
                  No se encontraron comprobantes.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const name = type === "sales" ? item.client?.name : item.supplier?.name;
                const cuit = type === "sales" ? item.client?.cuit : item.supplier?.cuit;
                const taxTotal = getTaxTotal(item, type);

                return (
                  <TableRow key={item.id} className="bg-[#141417] border-b-[#1F1F23] hover:bg-[#1A1A1D] transition-colors">
                    <TableCell className="text-[#6B6B70]">{getFormattedDate(item.date)}</TableCell>
                    <TableCell>{item.voucherLetter?.letter || "—"}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium text-[#FF5C00] hover:text-[#FF8A4C] underline-offset-4 hover:underline"
                        onClick={() => onSelectVoucher(item)}
                      >
                        {item.posNumber}-{item.number}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium text-[#FFFFFF]">{name || "—"}</TableCell>
                    <TableCell className="text-[#6B6B70]">{cuit || "—"}</TableCell>
                    <TableCell className="text-[#ADADB0]">{item.concept || "—"}</TableCell>
                    <TableCell className="text-[#ADADB0]">{item.paymentMethod || "—"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-[#6B6B70]">{getFormattedDate(item.paymentDate)}</TableCell>
                    <TableCell className="text-[#ADADB0]">{taxTotal > 0 ? getFormattedAmount(item.currency, taxTotal) : "—"}</TableCell>
                    <TableCell className="text-right font-['DM_Mono',system-ui,sans-serif] text-[#ADADB0]">{getFormattedAmount(item.currency, Number(item.totalAmount || 0))}</TableCell>
                    <TableCell className="text-right font-['DM_Mono',system-ui,sans-serif] text-[#ADADB0]">{getFormattedAmount(item.currency, Number(item.paidAmount || 0))}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" className="h-8 w-8 p-0 text-[#6B6B70] hover:text-[#FFFFFF] hover:bg-[#1A1A1D]">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="bg-[#1A1A1D] border-[#2A2A2E] text-[#FFFFFF]">
                          <DropdownMenuLabel className="text-[#6B6B70]">Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-[#2A2A2E]" />
                          <DropdownMenuItem onClick={() => onSelectVoucher(item)} className="focus:bg-[#2A2A2E] focus:text-[#FFFFFF]">Ver detalle</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#2A2A2E]" />
                          <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-500" onClick={() => handleActionClick("eliminar")}>
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
