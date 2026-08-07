"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "src/components/ui/dialog";
import { Button } from "src/components/ui/button";
import { useVoucherForm } from "src/hooks/use-voucher-form";
import { VoucherModalDropzone } from "./voucher-modal-dropzone";
import { VoucherModalCoreFields } from "./voucher-modal-core-fields";
import { VoucherModalRetentions } from "./voucher-modal-retentions";

interface VoucherModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: "sales" | "purchases";
}

export function VoucherModal({ isOpen, onOpenChange, type }: VoucherModalProps) {
  const {
    form,
    fields,
    append,
    remove,
    isProcessing,
    catalogs,
    thirdParties,
    fileInputRef,
    handleDrop,
    handleDragOver,
    onDropzoneClick,
    onFileChange,
    onSubmit,
    handlePosBlur,
    handleNumberBlur,
  } = useVoucherForm({ isOpen, onOpenChange, type });

  const { handleSubmit, formState: { isValid } } = form;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Agregar Comprobante de {type === "sales" ? "Venta" : "Compra"}
          </DialogTitle>
          <DialogDescription>
            Sube el comprobante (PDF/JPG) para procesarlo con IA o completa los datos manualmente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          <VoucherModalDropzone
            isProcessing={isProcessing}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            onDropzoneClick={onDropzoneClick}
          />

          <VoucherModalCoreFields
            form={form}
            isProcessing={isProcessing}
            catalogs={catalogs}
            thirdParties={thirdParties}
            type={type}
            handlePosBlur={handlePosBlur}
            handleNumberBlur={handleNumberBlur}
          />

          {type === "purchases" && (
            <VoucherModalRetentions
              form={form}
              fields={fields}
              append={append}
              remove={remove}
              catalogs={catalogs}
              type={type}
            />
          )}

          <Button type="submit" className="w-full mt-4" disabled={!isValid || isProcessing}>
            Guardar Comprobante
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
