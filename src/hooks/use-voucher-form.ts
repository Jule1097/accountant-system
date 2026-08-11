"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToastManager } from "src/components/ui/toast";
import { useAuth } from "src/hooks/use-auth";
import { ApiRequestError, apiRequest } from "src/lib/api-client";
import { voucherFormSchema, VoucherFormValues } from "src/lib/schemas/voucher-form-schemas";
import { VoucherForm } from "src/models/VoucherForm";
import { Voucher } from "src/models/Voucher";
import { VoucherModalMode, VoucherScreenType } from "src/types/voucher";
import {
  VoucherFormCatalogState,
  VoucherParsedData,
  VoucherThirdPartyOption,
} from "src/types/voucher-form";

export type { VoucherFormValues } from "src/lib/schemas/voucher-form-schemas";

export interface UseVoucherFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: VoucherScreenType;
  mode: VoucherModalMode;
  catalogs: VoucherFormCatalogState;
  thirdParties: VoucherThirdPartyOption[];
  initialVoucher?: Voucher | null;
  onSuccess?: (voucher: Voucher, mode: VoucherModalMode) => void;
}

async function parseResponseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function resolveVoucherSuccessMessage(mode: VoucherModalMode, type: VoucherScreenType): string {
  if (mode === "edit") {
    return "El comprobante se actualizó correctamente.";
  }

  return `La ${type === "sales" ? "venta" : "compra"} se guardó correctamente.`;
}

function resolveVoucherErrorMessage(error: unknown, mode: VoucherModalMode): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (mode === "edit") {
    return "No se pudo guardar la edición del comprobante.";
  }

  return "No se pudo guardar el comprobante.";
}

export function useVoucherForm({
  isOpen,
  onOpenChange,
  type,
  mode,
  catalogs,
  thirdParties,
  initialVoucher,
  onSuccess,
}: UseVoucherFormProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastManager = useToastManager();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastResetKeyRef = useRef<string | null>(null);
  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema) as unknown as Resolver<VoucherFormValues>,
    mode: "onChange",
    defaultValues: VoucherForm.buildInitialValues(),
  });
  const {
    control,
    getValues,
    reset,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = form;
  const retentionFieldArray = useFieldArray({
    control,
    name: "retentions",
  });
  const perceptionFieldArray = useFieldArray({
    control,
    name: "perceptions",
  });
  const selectedThirdPartyId = useWatch({
    control,
    name: "thirdPartyId",
  });
  const watchedVoucherLetterId = useWatch({
    control,
    name: "voucherLetterId",
  });
  const watchedTotalAmount = useWatch({
    control,
    name: "totalAmount",
  });
  const watchedVatAmount = useWatch({
    control,
    name: "vatAmount",
  });
  const isProcessing = isParsing || isSubmitting;

  useEffect(() => {
    if (!isOpen) {
      lastResetKeyRef.current = null;
      return;
    }

    const resetKey = mode === "edit" ? initialVoucher?.id || "edit-pending" : "create";

    if (lastResetKeyRef.current === resetKey) {
      return;
    }

    lastResetKeyRef.current = resetKey;
    reset(VoucherForm.buildInitialValues(initialVoucher, user?.id));
    void trigger();
  }, [initialVoucher, isOpen, mode, reset, trigger, user?.id]);

  useEffect(() => {
    if (!selectedThirdPartyId) {
      return;
    }

    const matchedThirdParty = thirdParties.find((thirdParty) => thirdParty.id === selectedThirdPartyId);

    if (!matchedThirdParty) {
      return;
    }

    setValue("thirdPartyCuit", matchedThirdParty.cuit, { shouldValidate: true });
  }, [selectedThirdPartyId, setValue, thirdParties]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    if (getValues("createdByUserId") === user.id) {
      return;
    }

    setValue("createdByUserId", user.id, { shouldDirty: false, shouldTouch: false, shouldValidate: true });
  }, [getValues, setValue, user?.id]);

  useEffect(() => {
    const normalizedSubtotal = VoucherForm.resolveSalesSubtotal(
      type,
      watchedVoucherLetterId,
      watchedTotalAmount,
      watchedVatAmount,
      catalogs
    );

    if (normalizedSubtotal === null) {
      return;
    }

    if (getValues("subtotal") === normalizedSubtotal) {
      return;
    }

    setValue("subtotal", normalizedSubtotal, { shouldValidate: true });
  }, [catalogs, getValues, setValue, type, watchedTotalAmount, watchedVatAmount, watchedVoucherLetterId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    console.info("Voucher form validation state", {
      operation: mode === "edit" ? "update-voucher" : "create-voucher",
      workflowState: isProcessing ? "processing" : "idle",
      voucherId: initialVoucher?.id ?? null,
      type,
      isValid,
      errors,
    });
  }, [errors, initialVoucher?.id, isOpen, isProcessing, isValid, mode, type]);

  const applyParsedVoucherData = async (parsedData: VoucherParsedData): Promise<void> => {
    const patch = VoucherForm.buildParsedPatch(parsedData, getValues(), type, catalogs, thirdParties);
    reset({ ...getValues(), ...patch }, { keepDirty: true, keepTouched: true });
    const isParsedFormValid = await trigger();

    console.info("Voucher parser patch applied", {
      operation: mode === "edit" ? "update-voucher" : "create-voucher",
      workflowState: "parsed",
      voucherId: initialVoucher?.id ?? null,
      type,
      isValid: isParsedFormValid,
      values: getValues(),
    });
  };

  const handleFile = async (file: File): Promise<void> => {
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("voucherKind", type === "sales" ? "sale" : "purchase");

      const response = await apiRequest("/api/vouchers/parse", {
        method: "POST",
        body: formData,
      });
      const parsedData = await parseResponseJson<VoucherParsedData>(response);

      await applyParsedVoucherData(parsedData);

      toastManager.add({
        type: "success",
        title: "Procesamiento completado",
        description: "Los campos detectados se completaron de manera automática.",
      });
    } catch (error: unknown) {
      console.error(error);
      toastManager.add({
        type: "error",
        title: "Error al procesar",
        description: "No se pudo procesar el comprobante por IA.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    if (!event.dataTransfer.files?.[0]) {
      return;
    }

    void handleFile(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
  };

  const onDropzoneClick = (): void => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (!event.target.files?.[0]) {
      return;
    }

    void handleFile(event.target.files[0]);
  };

  const onSubmit = async (values: VoucherFormValues): Promise<void> => {
    if (!values.createdByUserId) {
      toastManager.add({
        type: "error",
        title: "Sesión inválida",
        description: "No se pudo identificar al usuario actual.",
      });
      return;
    }

    if (mode === "edit" && !initialVoucher?.id) {
      toastManager.add({
        type: "error",
        title: "Comprobante no disponible",
        description: "No se pudo identificar el comprobante a editar.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = VoucherForm.buildPayload(values, type, catalogs);
      const endpoint = mode === "edit" ? `/api/vouchers/${initialVoucher?.id}` : "/api/vouchers";

      const response = await apiRequest(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const savedVoucher = new Voucher(data);

      toastManager.add({
        type: "success",
        title: mode === "edit" ? "Comprobante actualizado" : "Comprobante guardado",
        description: resolveVoucherSuccessMessage(mode, type),
      });

      onOpenChange(false);
      onSuccess?.(savedVoucher, mode);
    } catch (error: unknown) {
      toastManager.add({
        type: "error",
        title: mode === "edit" ? "No se pudo actualizar" : "No se pudo guardar",
        description: resolveVoucherErrorMessage(error, mode),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePosBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    const value = event.target.value;

    if (!value || !/^\d+$/.test(value)) {
      return;
    }

    setValue("posNumber", value.padStart(5, "0"), { shouldValidate: true });
  };

  const handleNumberBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    const value = event.target.value;

    if (!value || !/^\d+$/.test(value)) {
      return;
    }

    setValue("number", value.padStart(8, "0"), { shouldValidate: true });
  };

  return {
    form,
    retentionFields: retentionFieldArray.fields,
    appendRetention: retentionFieldArray.append,
    removeRetention: retentionFieldArray.remove,
    perceptionFields: perceptionFieldArray.fields,
    appendPerception: perceptionFieldArray.append,
    removePerception: perceptionFieldArray.remove,
    isProcessing,
    fileInputRef,
    handleDrop,
    handleDragOver,
    onDropzoneClick,
    onFileChange,
    onSubmit,
    handlePosBlur,
    handleNumberBlur,
  };
}
