"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToastManager } from "src/components/ui/toast";
import { useAuth } from "src/hooks/use-auth";
import { useVoucherPreview } from "src/hooks/use-voucher-preview";
import { ApiRequestError, apiRequest } from "src/lib/api-client";
import { voucherFormSchema, VoucherFormValues } from "src/lib/schemas/voucher-form-schemas";
import { VoucherForm } from "src/models/VoucherForm";
import { Voucher } from "src/models/Voucher";
import { ParserBatchAsyncResponse } from "src/types/parser-batch";
import { VoucherModalMode, VoucherScreenType } from "src/types/voucher";
import {
  VoucherFormCatalogState,
  VoucherFormPayload,
  VoucherParsedData,
  VoucherPreviewDocument,
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
  initialParsedData?: VoucherParsedData | null;
  resetKey?: string;
  submitAction?: (payload: VoucherFormPayload, values: VoucherFormValues) => Promise<void>;
  submitButtonLabel?: string;
  onSuccess?: (voucher: Voucher, mode: VoucherModalMode) => void;
}

async function parseResponseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function resolveVoucherKind(type: VoucherScreenType): "sale" | "purchase" {
  if (type === "sales") {
    return "sale";
  }

  return "purchase";
}

function toFileArray(files: FileList | null): File[] {
  if (!files?.length) {
    return [];
  }

  return Array.from(files);
}

function isParserBatchResponse(
  value: ParserBatchAsyncResponse | VoucherParsedData
): value is ParserBatchAsyncResponse {
  return "mode" in value && value.mode === "batch";
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

function buildEmptyVoucherFormValues(userId?: string): VoucherFormValues {
  return VoucherForm.buildInitialValues(undefined, userId);
}

export function useVoucherForm({
  isOpen,
  onOpenChange,
  type,
  mode,
  catalogs,
  thirdParties,
  initialVoucher,
  initialParsedData,
  resetKey,
  submitAction,
  onSuccess,
}: UseVoucherFormProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const toastManager = useToastManager();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastResetKeyRef = useRef<string | null>(null);
  const previewSourceUrl = useVoucherPreview(previewFile);
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
  const previewDocument: VoucherPreviewDocument | null = previewSourceUrl && previewFile
    ? {
      sourceUrl: previewSourceUrl,
      mimeType: previewFile.type,
      fileName: previewFile.name,
    }
    : null;

  useEffect(() => {
    if (!isOpen) {
      lastResetKeyRef.current = null;
      setTimeout(() => setPreviewFile(null), 0);
      return;
    }

    const nextResetKey = resetKey || (mode === "edit" ? initialVoucher?.id || "edit-pending" : "create");

    if (lastResetKeyRef.current === nextResetKey) {
      return;
    }

    lastResetKeyRef.current = nextResetKey;
    const nextValues = VoucherForm.buildInitialValues(initialVoucher, user?.id);

    if (initialParsedData) {
      const patch = VoucherForm.buildParsedPatch(initialParsedData, nextValues, type, catalogs, thirdParties);
      reset({ ...nextValues, ...patch });
    } else {
      reset(nextValues);
    }

    void trigger();
  }, [catalogs, initialParsedData, initialVoucher, isOpen, mode, reset, resetKey, thirdParties, trigger, type, user?.id]);

  useEffect(() => {
    if (!selectedThirdPartyId) {
      return;
    }

    const matchedThirdParty = thirdParties.find((thirdParty) => thirdParty.id === selectedThirdPartyId);

    if (!matchedThirdParty) {
      return;
    }

    if (getValues("thirdPartyCuit") === matchedThirdParty.cuit) {
      return;
    }

    setValue("thirdPartyCuit", matchedThirdParty.cuit, { shouldValidate: true });
  }, [getValues, selectedThirdPartyId, setValue, thirdParties]);

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
  }, [errors, initialVoucher?.id, isOpen, isProcessing, isValid, mode, type]);

  const applyParsedVoucherData = async (parsedData: VoucherParsedData): Promise<void> => {
    const patch = VoucherForm.buildParsedPatch(parsedData, getValues(), type, catalogs, thirdParties);
    reset({ ...getValues(), ...patch }, { keepDirty: true, keepTouched: true });
  };

  const handleFiles = async (files: File[]): Promise<void> => {
    if (!files.length) {
      return;
    }

    setPreviewFile(files.length === 1 ? files[0] : null);
    reset(buildEmptyVoucherFormValues(user?.id));
    void trigger();
    setIsParsing(true);

    try {
      const formData = new FormData();
      const voucherKind = resolveVoucherKind(type);

      for (const file of files) {
        formData.append("files", file);
      }

      formData.append("voucherKind", voucherKind);

      const response = await apiRequest("/api/vouchers/parse", {
        method: "POST",
        body: formData,
      });
      const parsedResponse = await parseResponseJson<ParserBatchAsyncResponse | VoucherParsedData>(response);

      if (isParserBatchResponse(parsedResponse)) {
        toastManager.add({
          type: "success",
          title: "Facturas en procesamiento",
          description: `Se enviaron ${parsedResponse.batch.totalFiles} archivos para procesar.`,
        });
        return;
      }

      await applyParsedVoucherData(parsedResponse);

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
    void handleFiles(toFileArray(event.dataTransfer.files));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
  };

  const onDropzoneClick = (): void => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    void handleFiles(toFileArray(event.target.files));
    event.target.value = "";
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

      if (submitAction) {
        await submitAction(payload, values);
        return;
      }

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

      if (mode !== "edit") {
        onOpenChange(false);
      }
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
    previewDocument,
  };
}
