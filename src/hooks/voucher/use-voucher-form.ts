"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToastManager } from "src/components/ui/toast";
import { useAuth } from "src/hooks/auth/use-auth";
import { useVoucherPreview } from "src/hooks/voucher/use-voucher-preview";
import { ApiRequestError, apiRequest, parseJsonResponse, resolveApiErrorMessage } from "src/lib/api/api-client";
import { createVoucherFormSchema, VoucherFormValues } from "src/lib/schemas/voucher/voucher-form-schemas";
import { buildVoucherFormInitialValues, buildVoucherFormPayload, buildVoucherParsedPatch, hasUnresolvedParsedVoucherTaxes, resolveSalesSubtotal } from "src/lib/helpers/voucher/voucher-form";
import { ParserBatchAsyncResponse } from "src/types/parser/parser-batch";
import { ParsedVoucherData } from "src/types/parser/gemini-parser";
import { VoucherApiResponse } from "src/types/voucher/voucher-api";
import { VoucherModalMode, VoucherScreenType } from "src/types/voucher/voucher";
import {
  VoucherFormCatalogState,
  VoucherFormPayload,
  VoucherPreviewDocument,
  VoucherThirdPartyOption,
} from "src/types/voucher/voucher-form";
import { resolveVoucherRecordType } from "src/lib/helpers/voucher/voucher-management";
import { feedbackTypes } from "src/lib/constants/feedback";
import { possibleNonFiscalDuplicateMessage, purchaseIdentificationConversionMessage, voucherConfirmationKinds, voucherDocumentIdentificationModes, voucherParsedTaxReviewMessage, voucherParsedTaxReviewTitle } from "src/lib/constants/voucher";

export type { VoucherFormValues } from "src/lib/schemas/voucher/voucher-form-schemas";

export interface PendingVoucherConfirmation {
  kind: typeof voucherConfirmationKinds[keyof typeof voucherConfirmationKinds];
  values: VoucherFormValues;
}

export interface UseVoucherFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: VoucherScreenType;
  mode: VoucherModalMode;
  catalogs: VoucherFormCatalogState;
  thirdParties: VoucherThirdPartyOption[];
  initialVoucher?: VoucherApiResponse | null;
  initialParsedData?: ParsedVoucherData | null;
  resetKey?: string;
  submitAction?: (payload: VoucherFormPayload, values: VoucherFormValues) => Promise<void>;
  submitButtonLabel?: string;
  onSuccess?: (voucher: VoucherApiResponse, mode: VoucherModalMode) => void;
}

function toFileArray(files: FileList | null): File[] {
  if (!files?.length) {
    return [];
  }

  return Array.from(files);
}

function isParserBatchResponse(
  value: ParserBatchAsyncResponse | ParsedVoucherData
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
  const fallbackMessage = mode === "edit" ? "No se pudo guardar la edición del comprobante." : "No se pudo guardar el comprobante.";
  return resolveApiErrorMessage(error, fallbackMessage);
}

function buildEmptyVoucherFormValues(userId?: string): VoucherFormValues {
  return buildVoucherFormInitialValues(undefined, userId);
}

function resolveVoucherConfirmationKind(payload: unknown): PendingVoucherConfirmation["kind"] | null {
  if (!payload || typeof payload !== "object" || !("error" in payload) || typeof payload.error !== "string") return null;
  if (payload.error === possibleNonFiscalDuplicateMessage) return voucherConfirmationKinds.nonFiscalDuplicate;
  if (payload.error === purchaseIdentificationConversionMessage) return voucherConfirmationKinds.identificationConversion;
  return null;
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
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingVoucherConfirmation | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [sessionCycle, setSessionCycle] = useState(0);
  const [parsedDataOverride, setParsedDataOverride] = useState<{
    sessionKey: string;
    data: ParsedVoucherData | null;
  } | null>(null);
  const toastManager = useToastManager();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastResetKeyRef = useRef<string | null>(null);
  const lastParsedDataRef = useRef<string | null>(null);
  const previewSourceUrl = useVoucherPreview(previewFile);
  const activeResetKey = resetKey || (mode === "edit" ? initialVoucher?.id || "edit-pending" : "create");
  const activeSessionKey = `${sessionCycle}:${activeResetKey}`;
  const currentParsedData = parsedDataOverride?.sessionKey === activeSessionKey
    ? parsedDataOverride.data
    : initialParsedData || null;
  const formSchema = useMemo(() => createVoucherFormSchema(catalogs), [catalogs]);
  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(formSchema) as Resolver<VoucherFormValues>,
    mode: "onChange",
    defaultValues: buildVoucherFormInitialValues(),
  });
  const {
    control,
    getValues,
    reset,
    setValue,
    trigger,
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
  const watchedCurrency = useWatch({
    control,
    name: "currency",
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
      lastParsedDataRef.current = null;
      return;
    }

    const parsedDataSignature = initialParsedData ? JSON.stringify(initialParsedData) : null;

    if (lastResetKeyRef.current !== activeResetKey) {
      lastResetKeyRef.current = activeResetKey;
      lastParsedDataRef.current = parsedDataSignature;
      const nextValues = buildVoucherFormInitialValues(initialVoucher, user?.id);

      if (initialParsedData) {
        const patch = buildVoucherParsedPatch(initialParsedData, nextValues, type, catalogs, thirdParties);
        reset({ ...nextValues, ...patch });
        if (hasUnresolvedParsedVoucherTaxes(initialParsedData, type)) toastManager.add({ type: feedbackTypes.warning, title: voucherParsedTaxReviewTitle, description: voucherParsedTaxReviewMessage });
      } else {
        reset(nextValues);
      }

      void trigger();
      return;
    }

    if (!parsedDataSignature || !initialParsedData || lastParsedDataRef.current === parsedDataSignature) {
      return;
    }

    lastParsedDataRef.current = parsedDataSignature;
    const patch = buildVoucherParsedPatch(initialParsedData, getValues(), type, catalogs, thirdParties);
    reset({ ...getValues(), ...patch }, { keepDirtyValues: true, keepTouched: true });
    if (hasUnresolvedParsedVoucherTaxes(initialParsedData, type)) toastManager.add({ type: feedbackTypes.warning, title: voucherParsedTaxReviewTitle, description: voucherParsedTaxReviewMessage });
    void trigger();
  }, [activeResetKey, catalogs, getValues, initialParsedData, initialVoucher, isOpen, reset, thirdParties, toastManager, trigger, type, user?.id]);

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      setSessionCycle((currentValue) => currentValue + 1);
      setParsedDataOverride(null);
      setPreviewFile(null);
    }

    onOpenChange(open);
  };

  useEffect(() => {
    if (!selectedThirdPartyId) {
      return;
    }

    const matchedThirdParty = thirdParties.find((thirdParty) => thirdParty.id === selectedThirdPartyId);

    if (!matchedThirdParty) {
      return;
    }

    const keepsHistoricalPurchaseMode = type === "purchases" && mode === "edit" && initialVoucher?.supplierId === matchedThirdParty.id;
    if (keepsHistoricalPurchaseMode) {
      if (matchedThirdParty.cuit === getValues("thirdPartyCuit")) return;
      setValue("thirdPartyCuit", matchedThirdParty.cuit || "", { shouldValidate: true });
      return;
    }

    const nextIdentificationMode = type === "purchases" && matchedThirdParty.taxIdentificationMode === "without_cuit" ? voucherDocumentIdentificationModes.nonFiscal : voucherDocumentIdentificationModes.fiscal;
    if (getValues("thirdPartyCuit") === (matchedThirdParty.cuit || "") && getValues("documentIdentificationMode") === nextIdentificationMode) {
      return;
    }

    setValue("thirdPartyCuit", matchedThirdParty.cuit || "", { shouldValidate: true });
    setValue("documentIdentificationMode", nextIdentificationMode, { shouldValidate: true });
    if (nextIdentificationMode === voucherDocumentIdentificationModes.nonFiscal) {
      setValue("voucherLetterId", "", { shouldValidate: true });
      setValue("posNumber", "", { shouldValidate: true });
      setValue("number", "", { shouldValidate: true });
    }
  }, [getValues, initialVoucher?.supplierId, mode, selectedThirdPartyId, setValue, thirdParties, type]);

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
    const normalizedSubtotal = resolveSalesSubtotal(
      type,
      watchedVoucherLetterId,
      watchedTotalAmount,
      watchedVatAmount,
      catalogs,
      watchedCurrency
    );

    if (normalizedSubtotal === null) {
      return;
    }

    if (getValues("subtotal") === normalizedSubtotal) {
      return;
    }

    setValue("subtotal", normalizedSubtotal, { shouldValidate: true });
  }, [catalogs, getValues, setValue, type, watchedCurrency, watchedTotalAmount, watchedVatAmount, watchedVoucherLetterId]);

  const applyParsedVoucherData = async (parsedData: ParsedVoucherData): Promise<void> => {
    const patch = buildVoucherParsedPatch(parsedData, getValues(), type, catalogs, thirdParties);
    setParsedDataOverride({
      sessionKey: activeSessionKey,
      data: parsedData,
    });
    reset({ ...getValues(), ...patch }, { keepDirty: true, keepTouched: true });
    if (hasUnresolvedParsedVoucherTaxes(parsedData, type)) toastManager.add({ type: feedbackTypes.warning, title: voucherParsedTaxReviewTitle, description: voucherParsedTaxReviewMessage });
  };

  const handleFiles = async (files: File[]): Promise<void> => {
    if (!files.length) {
      return;
    }

    setPreviewFile(files.length === 1 ? files[0] : null);
    setParsedDataOverride({
      sessionKey: activeSessionKey,
      data: null,
    });
    reset(buildEmptyVoucherFormValues(user?.id));
    void trigger();
    setIsParsing(true);

    try {
      const formData = new FormData();
      const voucherKind = resolveVoucherRecordType(type);

      for (const file of files) {
        formData.append("files", file);
      }

      formData.append("voucherKind", voucherKind);

      const response = await apiRequest("/api/vouchers/parse", {
        method: "POST",
        body: formData,
      });
      const parsedResponse = await parseJsonResponse<ParserBatchAsyncResponse | ParsedVoucherData>(response);

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
      toastManager.add({
        type: "error",
        title: "Error al procesar",
        description: resolveApiErrorMessage(error, "No se pudo procesar el comprobante por IA."),
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

  const submitVoucherValues = async (values: VoucherFormValues, confirmation?: PendingVoucherConfirmation["kind"]): Promise<void> => {
    setIsSubmitting(true);
    try {
      const basePayload = buildVoucherFormPayload(values, type, catalogs);
      const payload: VoucherFormPayload = { ...basePayload, confirmNonFiscalDuplicate: confirmation === voucherConfirmationKinds.nonFiscalDuplicate || undefined, confirmIdentificationModeConversion: confirmation === voucherConfirmationKinds.identificationConversion || undefined };
      const endpoint = mode === "edit" ? `/api/vouchers/${initialVoucher?.id}` : "/api/vouchers";
      if (submitAction) {
        await submitAction(payload, values);
        return;
      }
      const response = await apiRequest(endpoint, { method: mode === "edit" ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const savedVoucher = await parseJsonResponse<VoucherApiResponse>(response);
      toastManager.add({ type: "success", title: mode === "edit" ? "Comprobante actualizado" : "Comprobante guardado", description: resolveVoucherSuccessMessage(mode, type) });
      if (mode !== "edit") handleOpenChange(false);
      onSuccess?.(savedVoucher, mode);
    } catch (error: unknown) {
      const confirmationKind = error instanceof ApiRequestError ? resolveVoucherConfirmationKind(error.payload) : null;
      if (confirmationKind) {
        setPendingConfirmation({ kind: confirmationKind, values });
        return;
      }
      toastManager.add({ type: "error", title: mode === "edit" ? "No se pudo actualizar" : "No se pudo guardar", description: resolveVoucherErrorMessage(error, mode) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: VoucherFormValues): Promise<void> => {
    if (!values.createdByUserId) {
      toastManager.add({ type: "error", title: "Sesión inválida", description: "No se pudo identificar al usuario actual." });
      return;
    }
    if (mode === "edit" && !initialVoucher?.id) {
      toastManager.add({ type: "error", title: "Comprobante no disponible", description: "No se pudo identificar el comprobante a editar." });
      return;
    }
    await submitVoucherValues(values);
  };

  const confirmPendingSubmission = async (): Promise<void> => {
    if (!pendingConfirmation) return;
    const confirmation = pendingConfirmation;
    setPendingConfirmation(null);
    await submitVoucherValues(confirmation.values, confirmation.kind);
  };

  const cancelPendingSubmission = (): void => setPendingConfirmation(null);

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
    isParsing,
    isProcessing,
    pendingConfirmation,
    confirmPendingSubmission,
    cancelPendingSubmission,
    fileInputRef,
    handleDrop,
    handleDragOver,
    onDropzoneClick,
    onFileChange,
    onSubmit,
    handleOpenChange,
    handlePosBlur,
    handleNumberBlur,
    previewDocument,
    currentParsedData,
  };
}
