import { RefObject } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

interface VoucherModalDropzoneProps {
  isProcessing: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDropzoneClick: () => void;
}

export function VoucherModalDropzone({
  isProcessing,
  fileInputRef,
  onFileChange,
  handleDrop,
  handleDragOver,
  onDropzoneClick,
}: VoucherModalDropzoneProps) {
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        multiple
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={onDropzoneClick}
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 text-muted-foreground mb-4 animate-spin" />
            <p className="text-sm font-medium">Procesando...</p>
            <p className="text-xs text-muted-foreground mt-1">Cargando datos del comprobante</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium">Arrastra y suelta tus archivos aquí, o haz click para buscar</p>
            <p className="text-xs text-muted-foreground mt-1">Soporta PDF, PNG, JPG o JPEG</p>
          </>
        )}
      </div>
    </>
  );
}
