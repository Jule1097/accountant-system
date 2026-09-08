"use client";

import type { MouseEvent } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "src/components/ui/button";
import { resolveClientSupplierEntityLabel } from "src/lib/helpers/third-party/third-party-ui";
import type { DataTableColumn } from "src/types/shared/data-table";
import type { ClientSupplierEntityType, ClientSupplierRecord } from "src/types/third-party/third-party-resource";

interface ClientSupplierTableColumnOptions {
  type: ClientSupplierEntityType;
  onSelectRecord: (record: ClientSupplierRecord, action?: "view" | "edit") => void;
  onDeleteRecord: (record: ClientSupplierRecord) => void;
}

export function createClientSupplierTableColumns({
  type,
  onSelectRecord,
  onDeleteRecord,
}: ClientSupplierTableColumnOptions): DataTableColumn<ClientSupplierRecord>[] {
  const entityLabel = resolveClientSupplierEntityLabel(type);

  return [
    {
      id: "name",
      header: "Nombre",
      accessor: (row) => row.name,
    },
    {
      id: "cuit",
      header: "CUIT",
      accessor: (row) => row.cuit,
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-[#FF5C00]"
            aria-label={`Ver ${entityLabel}`}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onSelectRecord(row, "view");
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-[#FF5C00]"
            aria-label={`Editar ${entityLabel}`}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onSelectRecord(row, "edit");
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Eliminar ${entityLabel}`}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onDeleteRecord(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
