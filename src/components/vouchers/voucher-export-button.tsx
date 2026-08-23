"use client";

import { Download, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "src/components/ui/dropdown-menu";
import { VoucherScreenType, VoucherListQueryState } from "src/types/voucher";
import { useCompany } from "src/contexts/company-context";
import { useVoucherExport } from "src/hooks/use-voucher-export";

interface VoucherExportButtonProps {
  type: VoucherScreenType;
  query: VoucherListQueryState;
}

export function VoucherExportButton({ type, query }: VoucherExportButtonProps) {
  const { activeCompanyId } = useCompany();
  const { isExporting, handleExport } = useVoucherExport();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton
        render={
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-card shadow-xs hover:bg-accent hover:text-accent-foreground h-9 px-3 text-foreground"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
        <DropdownMenuItem
          className="hover:bg-muted cursor-pointer"
          onClick={() => handleExport("filters", type, query, activeCompanyId)}
        >
          Exportar Vista Actual
        </DropdownMenuItem>
        <DropdownMenuItem
          className="hover:bg-muted cursor-pointer"
          onClick={() => handleExport("declaration", type, query, activeCompanyId)}
        >
          Exportar para Declaración
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
