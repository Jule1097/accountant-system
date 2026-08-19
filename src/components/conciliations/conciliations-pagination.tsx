import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "src/components/ui/button";

interface ConciliationsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  startIndex: number;
  onPageChange: (page: number) => void;
}

export function ConciliationsPagination({
  currentPage,
  totalPages,
  totalCount,
  startIndex,
  onPageChange,
}: ConciliationsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex w-full flex-col justify-between gap-4 pt-4 pb-4 sm:flex-row sm:items-center">
      <div className="text-sm text-muted-foreground">
        Mostrando {startIndex + 1}-{Math.min(startIndex + 4, totalCount)} de {totalCount} (Pág. {currentPage} de {totalPages})
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`h-8 w-8 bg-card border-border text-muted-foreground ${currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:bg-secondary"}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
          const isActive = page === currentPage;

          return (
            <Button
              key={page}
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page)}
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
          onClick={() => onPageChange(currentPage + 1)}
          className={`h-8 w-8 bg-card border-border text-muted-foreground ${currentPage === totalPages ? "cursor-not-allowed opacity-50" : "hover:bg-secondary"}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
