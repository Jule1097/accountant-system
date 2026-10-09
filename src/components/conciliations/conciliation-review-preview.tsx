"use client";

import dynamic from "next/dynamic";
import { Card } from "src/components/ui/card";
import Image from "next/image";
import { Button } from "src/components/ui/button";
import { Minus, Plus, RotateCcw, RotateCw } from "lucide-react";
import { SyntheticEvent, useEffect, useState } from "react";
import { useConciliationRasterPreview } from "src/hooks/conciliation/use-conciliation-raster-preview";
import { conciliationRasterPreview } from "src/lib/constants/conciliation";

const ConciliationPdfPreview = dynamic(
  () => import("src/components/conciliations/conciliation-pdf-preview").then((module) => module.ConciliationPdfPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Cargando PDF...
      </div>
    ),
  }
);

interface ConciliationReviewPreviewProps {
  sourceUrl: string | null;
  mimeType: string | null;
  fileName: string | null;
}

function isImageMimeType(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith("image/");
}

function isPdfMimeType(mimeType: string | null): boolean {
  return mimeType === "application/pdf";
}

export function ConciliationReviewPreview({
  sourceUrl,
  mimeType,
  fileName,
}: ConciliationReviewPreviewProps) {
  const rasterPreview = useConciliationRasterPreview();
  const resetRasterPreview = rasterPreview.reset;
  const [loadedImage, setLoadedImage] = useState<{ sourceUrl: string | null; width: number; height: number }>({ sourceUrl: null, width: conciliationRasterPreview.imageWidth, height: conciliationRasterPreview.imageHeight });
  const imageDimensions = loadedImage.sourceUrl === sourceUrl ? loadedImage : { width: conciliationRasterPreview.imageWidth, height: conciliationRasterPreview.imageHeight };
  const isQuarterTurn = Math.abs(rasterPreview.rotation) % conciliationRasterPreview.rotationHalfTurn === conciliationRasterPreview.rotationStep;
  const previewWidth = (isQuarterTurn ? imageDimensions.height : imageDimensions.width) * rasterPreview.zoom;
  const previewHeight = (isQuarterTurn ? imageDimensions.width : imageDimensions.height) * rasterPreview.zoom;
  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>): void => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth <= 0 || naturalHeight <= 0) return;
    setLoadedImage({ sourceUrl, width: naturalWidth, height: naturalHeight });
  };

  useEffect(() => {
    resetRasterPreview();
  }, [mimeType, resetRasterPreview, sourceUrl]);

  return (
    <Card className="overflow-hidden border border-border/50 bg-card">
      <div className="h-[min(76vh,920px)] bg-muted/20">
        {!sourceUrl ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No se pudo cargar la vista previa del archivo.
          </div>
        ) : isImageMimeType(mimeType) ? (
          <div className="flex h-full flex-col">
            <div className="relative min-h-0 flex-1 overflow-x-auto overflow-y-scroll">
              <div className="flex min-h-full min-w-full items-center justify-center p-4">
                <div className="relative shrink-0 overflow-hidden" style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src={sourceUrl}
                      alt={fileName || "Documento fuente"}
                      width={imageDimensions.width}
                      height={imageDimensions.height}
                      onLoad={handleImageLoad}
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 560px"
                      className="max-h-none max-w-none object-contain transition-transform"
                      style={{ width: "auto", height: "auto", transform: `scale(${rasterPreview.zoom}) rotate(${rasterPreview.rotation}deg)` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-border/50 px-4 py-3">
              <Button type="button" variant="outline" size="sm" onClick={rasterPreview.zoomOut} aria-label="Alejar imagen"><Minus className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="outline" size="sm" onClick={rasterPreview.reset} aria-label="Restablecer imagen">{Math.round(rasterPreview.zoom * 100)}%</Button>
              <Button type="button" variant="outline" size="sm" onClick={rasterPreview.zoomIn} aria-label="Acercar imagen"><Plus className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="outline" size="sm" onClick={rasterPreview.rotateCounterClockwise} aria-label="Rotar imagen a la izquierda"><RotateCcw className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="outline" size="sm" onClick={rasterPreview.rotateClockwise} aria-label="Rotar imagen a la derecha"><RotateCw className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ) : isPdfMimeType(mimeType) ? (
          <ConciliationPdfPreview key={sourceUrl} sourceUrl={sourceUrl} />
        ) : (
          <iframe title={fileName || "Documento fuente"} src={sourceUrl} className="h-full w-full border-0" />
        )}
      </div>
    </Card>
  );
}
