"use client";

import { Card } from "src/components/ui/card";
import { Button } from "src/components/ui/button";
import { useConciliations } from "src/hooks/use-conciliations";
import { ConciliationCard } from "src/components/conciliations/conciliation-card";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

export function ConciliationsView() {
  const {
    activeTab,
    currentPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedVouchers,
    loadingVouchers,
    handleTabChange,
    handlePageChange,
    handleReview,
    handleRegenerate,
    handleDelete,
  } = useConciliations();

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[38px] font-mono font-normal tracking-[-1px] text-foreground leading-none">Conciliaciones</h2>
          <p className="text-sm text-muted-foreground mt-2">Revisión, regeneración y descarte de comprobantes pendientes de validación.</p>
        </div>
      </div>

      <div className="flex border-b border-border/40 gap-4">
        <button
          onClick={() => handleTabChange("sales")}
          className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === "sales"
            ? "text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Ventas
        </button>
        <button
          onClick={() => handleTabChange("purchases")}
          className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === "purchases"
            ? "text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Compras
        </button>
      </div>

      <div className="space-y-4">
        {paginatedVouchers.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border border-border/50 bg-card rounded-lg">
            <CheckCircle className="h-8 w-8 text-emerald-500 mb-3" />
            <div className="text-sm font-semibold text-foreground">¡Todo al día!</div>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">No hay comprobantes pendientes de conciliación en esta lista.</p>
          </Card>
        ) : (
          paginatedVouchers.map((voucher) => (
            <ConciliationCard
              key={voucher.uuid}
              voucher={voucher}
              isRegenerating={!!loadingVouchers[voucher.uuid]}
              onReview={handleReview}
              onRegenerate={handleRegenerate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between pt-4 pb-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(startIndex + 4, totalCount)} de {totalCount} (Pág. {currentPage} de {totalPages})
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className={`h-8 w-8 bg-card border-border text-muted-foreground ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary"
                }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isActive = page === currentPage;
              return (
                <Button
                  key={page}
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(page)}
                  className={`h-8 w-8 ${isActive
                    ? "bg-[#FF5C00] border-[#FF5C00] text-primary-foreground hover:bg-[#FF8A4C] hover:text-primary-foreground"
                    : "bg-card border-border text-foreground hover:bg-secondary"
                    }`}
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className={`h-8 w-8 bg-card border-border text-muted-foreground ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary"
                }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
