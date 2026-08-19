"use client";

import { useState } from "react";
import {
  buildConciliationPdfPageLabel,
  buildConciliationPdfZoomLabel,
  canDecreaseConciliationPdfZoom,
  canIncreaseConciliationPdfZoom,
  getConciliationPdfDefaultZoom,
  getConciliationPdfNextPage,
  getConciliationPdfNextZoom,
  getConciliationPdfPageWidth,
  getConciliationPdfPreviousPage,
  getConciliationPdfPreviousZoom,
} from "src/lib/helpers/conciliation-pdf-preview";
import { ConciliationPdfLoadSuccessPayload } from "src/types/conciliation-pdf-preview";
import { useElementWidth } from "src/hooks/use-element-width";

export function useConciliationPdfPreview() {
  const [containerRef, containerWidth] = useElementWidth<HTMLDivElement>();
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(getConciliationPdfDefaultZoom());
  const [hasError, setHasError] = useState(false);

  const handleLoadSuccess = ({ numPages }: ConciliationPdfLoadSuccessPayload): void => {
    setPageCount(numPages);
    setPageNumber(1);
    setZoom(getConciliationPdfDefaultZoom());
    setHasError(false);
  };

  const handleLoadError = (): void => {
    setHasError(true);
  };

  const handlePreviousPage = (): void => {
    setPageNumber((currentValue) => getConciliationPdfPreviousPage(currentValue));
  };

  const handleNextPage = (): void => {
    setPageNumber((currentValue) => getConciliationPdfNextPage(currentValue, pageCount));
  };

  const handleZoomOut = (): void => {
    setZoom((currentValue) => getConciliationPdfPreviousZoom(currentValue));
  };

  const handleZoomIn = (): void => {
    setZoom((currentValue) => getConciliationPdfNextZoom(currentValue));
  };

  const handleResetZoom = (): void => {
    setZoom(getConciliationPdfDefaultZoom());
  };

  return {
    containerRef,
    pageNumber,
    pageCount,
    zoom,
    hasError,
    pageLabel: buildConciliationPdfPageLabel(pageNumber, pageCount),
    zoomLabel: buildConciliationPdfZoomLabel(zoom),
    pageWidth: getConciliationPdfPageWidth(containerWidth) * zoom,
    canGoPrevious: pageNumber > 1,
    canGoNext: !!pageCount && pageNumber < pageCount,
    canZoomOut: canDecreaseConciliationPdfZoom(zoom),
    canZoomIn: canIncreaseConciliationPdfZoom(zoom),
    handleLoadSuccess,
    handleLoadError,
    handlePreviousPage,
    handleNextPage,
    handleZoomOut,
    handleZoomIn,
    handleResetZoom,
  };
}
