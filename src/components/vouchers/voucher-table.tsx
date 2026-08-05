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

interface Voucher {
  id: string;
  date: string;
  type: string;
  thirdPartyName: string; // Client or Supplier
  thirdPartyCuit: string;
  total: number;
}

interface VoucherTableProps {
  data: Voucher[];
  type: "sales" | "purchases";
  onAdd: () => void;
}

export function VoucherTable({ data, type, onAdd }: VoucherTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter(
    (item) =>
      item.thirdPartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.thirdPartyCuit.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute  left-2.5 top-1.5 h-4 w-4 text-muted-foreground" />
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
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No se encontraron comprobantes.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.thirdPartyName}</TableCell>
                  <TableCell>{item.thirdPartyCuit}</TableCell>
                  <TableCell className="text-right">
                    ${item.total.toFixed(2)}
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
                        <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                        <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
