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
import { VoucherModalPerceptions } from "./voucher-modal-perceptions";
import { Voucher } from "src/models/Voucher";

interface VoucherModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: "sales" | "purchases";
  initialVoucher?: Voucher | null;
}

export function VoucherModal({ isOpen, onOpenChange, type, initialVoucher }: VoucherModalProps) {
  const {
    form,
    retentionFields,
    appendRetention,
    removeRetention,
    perceptionFields,
    appendPerception,
    removePerception,
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
  } = useVoucherForm({ isOpen, onOpenChange, type, initialVoucher });

  const { handleSubmit, formState: { isValid } } = form;
  const isEditing = Boolean(initialVoucher);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Detalle del Comprobante" : `Agregar Comprobante de ${type === "sales" ? "Venta" : "Compra"}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Revisa el comprobante y ajusta la información en la interfaz. Los cambios aún no se guardan en la base."
              : "Sube el comprobante (PDF/JPG) para procesarlo con IA o completa los datos manualmente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          {!isEditing && (
            <VoucherModalDropzone
              isProcessing={isProcessing}
              fileInputRef={fileInputRef}
              onFileChange={onFileChange}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
              onDropzoneClick={onDropzoneClick}
            />
          )}

          <VoucherModalCoreFields
            form={form}
            isProcessing={isProcessing}
            catalogs={catalogs}
            thirdParties={thirdParties}
            type={type}
            handlePosBlur={handlePosBlur}
            handleNumberBlur={handleNumberBlur}
          />

          {type === "sales" && (
            <VoucherModalRetentions
              form={form}
              fields={retentionFields}
              append={appendRetention}
              remove={removeRetention}
              catalogs={catalogs}
            />
          )}

          {type === "purchases" && (
            <VoucherModalPerceptions
              form={form}
              fields={perceptionFields}
              append={appendPerception}
              remove={removePerception}
              catalogs={catalogs}
            />
          )}

          <Button type="submit" className="mt-4 w-full" disabled={!isValid || isProcessing}>
            {isEditing ? "Guardar edición (próximamente)" : "Guardar Comprobante"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
