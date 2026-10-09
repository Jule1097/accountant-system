import { conciliationPdfPreview } from "src/lib/constants/conciliation";

export function buildConciliationPdfWorkerSrc(version: string): string {
  return `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

export function buildConciliationPdfPageLabel(pageNumber: number, pageCount: number | null): string {
  if (!pageCount) {
    return "Cargando páginas...";
  }

  return `Página ${pageNumber} de ${pageCount}`;
}

export function getConciliationPdfNextPage(pageNumber: number, pageCount: number | null): number {
  return Math.min(pageNumber + 1, pageCount || 1);
}

export function getConciliationPdfPreviousPage(pageNumber: number): number {
  return Math.max(pageNumber - 1, 1);
}

export function getConciliationPdfPageWidth(containerWidth: number): number {
  if (containerWidth <= 0) {
    return conciliationPdfPreview.defaultPageWidth;
  }

  return Math.max(containerWidth - conciliationPdfPreview.pageHorizontalPadding, conciliationPdfPreview.minimumPageWidth);
}

export function getConciliationPdfDefaultZoom(): number {
  return conciliationPdfPreview.defaultZoom;
}

export function buildConciliationPdfZoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

export function getConciliationPdfNextZoom(zoom: number): number {
  return Math.min(zoom + conciliationPdfPreview.zoomStep, conciliationPdfPreview.maxZoom);
}

export function getConciliationPdfPreviousZoom(zoom: number): number {
  return Math.max(zoom - conciliationPdfPreview.zoomStep, conciliationPdfPreview.minZoom);
}

export function canIncreaseConciliationPdfZoom(zoom: number): boolean {
  return zoom < conciliationPdfPreview.maxZoom;
}

export function canDecreaseConciliationPdfZoom(zoom: number): boolean {
  return zoom > conciliationPdfPreview.minZoom;
}
