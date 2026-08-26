export function buildConciliationPdfWorkerSrc(version: string): string {
  return `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

const minConciliationPdfZoom = 0.75;
const maxConciliationPdfZoom = 2;
const conciliationPdfZoomStep = 0.25;

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
    return 320;
  }

  return Math.max(containerWidth - 24, 280);
}

export function getConciliationPdfDefaultZoom(): number {
  return 1;
}

export function buildConciliationPdfZoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

export function getConciliationPdfNextZoom(zoom: number): number {
  return Math.min(zoom + conciliationPdfZoomStep, maxConciliationPdfZoom);
}

export function getConciliationPdfPreviousZoom(zoom: number): number {
  return Math.max(zoom - conciliationPdfZoomStep, minConciliationPdfZoom);
}

export function canIncreaseConciliationPdfZoom(zoom: number): boolean {
  return zoom < maxConciliationPdfZoom;
}

export function canDecreaseConciliationPdfZoom(zoom: number): boolean {
  return zoom > minConciliationPdfZoom;
}
