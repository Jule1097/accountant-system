"use client";

import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "src/components/ui/button";
import { useConciliationPdfPreview } from "src/hooks/use-conciliation-pdf-preview";
import { buildConciliationPdfWorkerSrc } from "src/lib/helpers/conciliation-pdf-preview";
import { ConciliationPdfPreviewProps } from "src/types/conciliation-pdf-preview";

pdfjs.GlobalWorkerOptions.workerSrc = buildConciliationPdfWorkerSrc(pdfjs.version);

export function ConciliationPdfPreview({
  sourceUrl,
}: ConciliationPdfPreviewProps) {
  const {
    containerRef,
    pageNumber,
    hasError,
    pageLabel,
    pageWidth,
    canGoPrevious,
    canGoNext,
    zoomLabel,
    canZoomOut,
    canZoomIn,
    handleLoadSuccess,
    handleLoadError,
    handlePreviousPage,
    handleNextPage,
    handleZoomOut,
    handleZoomIn,
    handleResetZoom,
  } = useConciliationPdfPreview();

  if (hasError) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
        No se pudo renderizar el PDF en línea.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto px-1 py-2">
        <Document
          file={sourceUrl}
          loading={
            <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
              Cargando PDF...
            </div>
          }
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          error=""
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            width={pageWidth}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
        <div className="text-xs text-muted-foreground">{pageLabel}</div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={!canZoomOut}
              className="h-8 px-3"
              aria-label="Alejar PDF"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="h-8 min-w-16 px-3 text-xs"
              aria-label="Restablecer zoom del PDF"
            >
              {zoomLabel}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={!canZoomIn}
              className="h-8 px-3"
              aria-label="Acercar PDF"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
            className="h-8 px-3"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!canGoNext}
            className="h-8 px-3"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
