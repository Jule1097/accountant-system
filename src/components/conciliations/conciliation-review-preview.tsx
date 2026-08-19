import dynamic from "next/dynamic";
import { Card } from "src/components/ui/card";
import Image from "next/image";

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
  return (
    <Card className="overflow-hidden border border-border/50 bg-card">
      <div className="h-[min(76vh,920px)] bg-muted/20">
        {!sourceUrl ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No se pudo cargar la vista previa del archivo.
          </div>
        ) : isImageMimeType(mimeType) ? (
          <div className="relative h-full w-full">
            <Image
              src={sourceUrl}
              alt={fileName || "Documento fuente"}
              fill
              unoptimized
              className="object-contain"
            />
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
