"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "src/components/ui/dialog";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { UploadCloud, Loader2 } from "lucide-react";
import { useToastManager } from "src/components/ui/toast";

interface VoucherModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: "sales" | "purchases";
}

export function VoucherModal({ isOpen, onOpenChange, type }: VoucherModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const toastManager = useToastManager();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      toastManager.add({
        type: "info",
        title: "Archivo procesado",
        description: "Se han completado los campos detectados. Por favor verifique y complete los faltantes.",
      });
    }, 2000);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Agregar Comprobante de {type === "sales" ? "Venta" : "Compra"}
          </DialogTitle>
          <DialogDescription>
            Sube el comprobante (PDF/JPG) para procesarlo con IA o completa los datos manualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground mb-4 animate-spin" />
                <p className="text-sm font-medium">Procesando con Gemini AI...</p>
                <p className="text-xs text-muted-foreground mt-1">Cargando datos del comprobante</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">Arrastra y suelta tu archivo aquí</p>
                <p className="text-xs text-muted-foreground mt-1">Soporta PDF o JPG</p>
              </>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Fecha</label>
            <Input type="date" disabled={isProcessing} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Tipo</label>
            <Input placeholder="Ej. Factura A" disabled={isProcessing} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">{type === "sales" ? "Cliente" : "Proveedor"}</label>
            <Input placeholder="Razón Social" disabled={isProcessing} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">CUIT</label>
            <Input placeholder="00-00000000-0" disabled={isProcessing} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Total</label>
            <Input type="number" placeholder="0.00" disabled={isProcessing} />
          </div>

          {type === "purchases" && (
            <Button variant="outline" className="w-full mt-2" disabled={isProcessing}>
              Agregar Impuesto
            </Button>
          )}

          <Button className="w-full mt-4" disabled={isProcessing}>
            Guardar Comprobante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
