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
}

export function VoucherTable({ data, type, onAdd }: VoucherTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const toastManager = useToastManager();

  const filteredData = data.filter((item) => {
    const name = type === "sales" ? item.client?.name : item.supplier?.name;
    const cuit = type === "sales" ? item.client?.cuit : item.supplier?.cuit;
    return (
      (name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cuit || "").includes(searchTerm)
    );
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagado";
      case "partial":
        return "Parcial";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

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
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o CUIT..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              onClick={() => setSearchTerm("")}
              className="px-2 lg:px-3"
            >
              Borrar filtros
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={onAdd}>Agregar {type === "sales" ? "Venta" : "Compra"}</Button>
      </div>
      <div className="rounded-md border bg-card">
        <Table className="text-2xs">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead>{type === "sales" ? "Cliente" : "Proveedor"}</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No se encontraron comprobantes.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const name = type === "sales" ? item.client?.name : item.supplier?.name;
                const cuit = type === "sales" ? item.client?.cuit : item.supplier?.cuit;
                const dateStr = new Date(item.date).toLocaleDateString("es-AR", { timeZone: "UTC" });
                return (
                  <TableRow key={item.id}>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>
                      {item.voucherType?.name || ""} {item.voucherLetter?.letter || ""} {item.posNumber}-{item.number}
                    </TableCell>
                    <TableCell>{name || ""}</TableCell>
                    <TableCell>{cuit || ""}</TableCell>
                    <TableCell>{getStatusLabel(item.status)}</TableCell>
                    <TableCell className="text-right">
                      {item.currency === "USD" ? "USD" : "$"} {Number(item.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleActionClick("ver detalle")}>Ver detalle</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleActionClick("eliminar")}>
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
