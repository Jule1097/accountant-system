"use client";

import { useState } from "react";
import { useToastManager } from "src/components/ui/toast";
import { VoucherScreenType, VoucherListQueryState } from "src/types/voucher";

export function useVoucherExport() {
  const [isExporting, setIsExporting] = useState(false);
  const toastManager = useToastManager();

  const handleExport = async (
    mode: "filters" | "declaration",
    type: VoucherScreenType,
    query: VoucherListQueryState,
    activeCompanyId: string | null
  ) => {
    setIsExporting(true);
    try {
      const apiType = type === "sales" ? "sale" : "purchase";
      const params = new URLSearchParams();
      params.set("mode", mode);
      params.set("type", apiType);

      const shouldAppendFilters = mode === "filters";
      if (shouldAppendFilters && query.search) params.set("search", query.search);
      if (shouldAppendFilters && query.status) params.set("status", query.status);
      if (shouldAppendFilters && query.dateFrom) params.set("dateFrom", query.dateFrom);
      if (shouldAppendFilters && query.dateTo) params.set("dateTo", query.dateTo);
      if (shouldAppendFilters && query.sortBy) params.set("sortBy", query.sortBy);
      if (shouldAppendFilters && query.sortOrder) params.set("sortOrder", query.sortOrder);

      const response = await fetch(`/api/vouchers/export?${params.toString()}`, {
        headers: activeCompanyId ? { "x-company-id": activeCompanyId } : undefined,
      });
      const isResponseOk = response.ok;

      if (!isResponseOk) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error interno del servidor al exportar Excel");
      }

      const contentDisposition = response.headers.get("content-disposition") || "";
      let filename = mode === "declaration" ? "Libro_IVA.xlsx" : "Exportacion.xlsx";

      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toastManager.add({
        type: "success",
        title: "Exportación exitosa",
        description: "El archivo Excel se generó y descargó correctamente.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado al exportar.";
      toastManager.add({
        type: "error",
        title: "No se pudo exportar",
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    handleExport,
  };
}
