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
import { Search, Trash2, X, Filter, Download, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { Voucher } from "src/models/Voucher";

interface VoucherTableProps {
  data: Voucher[];
  type: "sales" | "purchases";
  onAdd: () => void;
  onSelectVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (voucher: Voucher) => void;
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

export function VoucherTable({ data, type, onAdd, onSelectVoucher, onDeleteVoucher }: VoucherTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = data.filter((item) => {
    const name = type === "sales" ? item.client?.name : item.supplier?.name;
    const cuit = type === "sales" ? item.client?.cuit : item.supplier?.cuit;

    return (
      (name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cuit || "").includes(searchTerm) ||
      `${item.posNumber}-${item.number}`.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, CUIT..."
              className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#FF5C00] h-9 text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 px-3 border-border bg-card text-foreground hover:bg-secondary">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            Filtrar
          </Button>
          {searchTerm && (
            <Button variant="ghost" onClick={() => setSearchTerm("")} className="h-9 px-2 lg:px-3 text-muted-foreground hover:text-foreground hover:bg-secondary">
              Borrar
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-3 border-border bg-card text-foreground hover:bg-secondary">
            <Download className="mr-2 h-4 w-4 text-muted-foreground" />
            Exportar
          </Button>
          <Button size="sm" onClick={onAdd} className="h-9 bg-[#FF5C00] hover:bg-[#FF8A4C] text-primary-foreground">
            Agregar {type === "sales" ? "Venta" : "Compra"}
          </Button>
        </div>
      </div>

      <div className="rounded-[12px] overflow-hidden bg-muted/40 border border-border">
        <Table className="text-[13px] text-foreground">
          <TableHeader className="bg-card">
            <TableRow className="border-b-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">Fecha</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">Letra</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">Comprobante</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">{type === "sales" ? "Cliente" : "Proveedor"}</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">CUIT</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">Concepto</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">Medio Pago</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">Estado</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">F. Pago</TableHead>
              <TableHead className="text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">{type === "sales" ? "Retenciones" : "Percepciones"}</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">Total</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold tracking-[0.5px] text-[11px]">Pagado</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow className="border-b-border bg-card">
                <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                  No se encontraron comprobantes.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const name = type === "sales" ? item.client?.name : item.supplier?.name;
                const cuit = type === "sales" ? item.client?.cuit : item.supplier?.cuit;
                const taxTotal = getTaxTotal(item, type);

                return (
                  <TableRow key={item.id} className="bg-card border-b-border hover:bg-secondary transition-colors">
                    <TableCell className="text-muted-foreground">{getFormattedDate(item.date)}</TableCell>
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
                    <TableCell className="font-medium text-foreground">{name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{cuit || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.concept || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.paymentMethod || "—"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{getFormattedDate(item.paymentDate)}</TableCell>
                    <TableCell className="text-muted-foreground">{taxTotal > 0 ? getFormattedAmount(item.currency, taxTotal) : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{getFormattedAmount(item.currency, Number(item.totalAmount || 0))}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{getFormattedAmount(item.currency, Number(item.paidAmount || 0))}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeleteVoucher(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar comprobante</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between pt-1 pb-4">
        <div className="text-sm text-muted-foreground">
          Mostrando 1-{Math.min(20, filteredData.length)} de {filteredData.length} (Pág. 1 de 1)
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-card border-border text-muted-foreground opacity-50 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-[#FF5C00] border-[#FF5C00] text-primary-foreground hover:bg-[#FF8A4C] hover:text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-card border-border text-foreground hover:bg-secondary hidden sm:flex">
            2
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-card border-border text-foreground hover:bg-secondary hidden sm:flex">
            3
          </Button>
          <span className="mx-1 text-muted-foreground hidden sm:block">...</span>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-card border-border text-foreground hover:bg-secondary hidden sm:flex">
            12
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3 border-border bg-card text-muted-foreground hover:bg-secondary">
            Mostrar: 20
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
