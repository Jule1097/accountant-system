"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToastManager } from "src/components/ui/toast";
import { apiRequest } from "src/lib/api-client";
import { Voucher } from "src/models/Voucher";
import { VoucherPerception, VoucherRetention } from "src/types/voucher";

const retentionFormSchema = z.object({
  retentionConceptId: z.string().min(1, "Concepto obligatorio"),
  taxJurisdictionId: z.string().optional().nullable(),
  amount: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
});

const perceptionFormSchema = z.object({
  perceptionConceptId: z.string().min(1, "Concepto obligatorio"),
  taxJurisdictionId: z.string().optional().nullable(),
  amount: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
});

export const voucherFormSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  voucherTypeId: z.string().min(1, "El tipo de comprobante es obligatorio"),
  voucherLetterId: z.string().min(1, "La letra es obligatoria"),
  posNumber: z.string().regex(/^\d{1,5}$/, "El punto de venta debe tener hasta 5 dígitos"),
  number: z.string().regex(/^\d{1,20}$/, "El número de comprobante debe tener hasta 20 dígitos"),
  thirdPartyId: z.string().min(1, "El cliente o proveedor es obligatorio"),
  thirdPartyCuit: z.string().min(1, "El CUIT es obligatorio"),
  currency: z.enum(["$", "USD"], { message: "La moneda es obligatoria" }),
  subtotal: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
  vatAmount: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
  nonTaxableAmount: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
  exemptAmount: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
  otherTaxesAmount: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
  totalAmount: z.number({ message: "Debe ser un número" }).min(0.01, "El total debe ser mayor a 0"),
  concept: z.string().optional(),
  paymentMethod: z.string().min(1, "El medio de pago es obligatorio"),
  status: z.enum(["pending", "partial", "paid"], { message: "El estado es obligatorio" }),
  paymentDate: z.string().optional(),
  paidAmount: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
  comments: z.string().optional(),
  retentions: z.array(retentionFormSchema),
  perceptions: z.array(perceptionFormSchema),
});

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;

type NumericVoucherField =
  | "subtotal"
  | "vatAmount"
  | "nonTaxableAmount"
  | "exemptAmount"
  | "otherTaxesAmount"
  | "totalAmount"
  | "paidAmount";

interface CatalogState {
  voucherTypes: { id: string; name: string }[];
  voucherLetters: { id: string; letter: string }[];
  retentionConcepts: { id: string; name: string; type: string }[];
  perceptionConcepts: { id: string; name: string }[];
  taxJurisdictions: { id: string; name: string }[];
}

export interface UseVoucherFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: "sales" | "purchases";
  initialVoucher?: Voucher | null;
}

const defaultFormValues: VoucherFormValues = {
  date: "",
  voucherTypeId: "",
  voucherLetterId: "",
  posNumber: "",
  number: "",
  thirdPartyId: "",
  thirdPartyCuit: "",
  currency: "$",
  subtotal: 0,
  vatAmount: 0,
  nonTaxableAmount: 0,
  exemptAmount: 0,
  otherTaxesAmount: 0,
  totalAmount: 0,
  concept: "",
  paymentMethod: "",
  status: "pending",
  paymentDate: "",
  paidAmount: 0,
  comments: "",
  retentions: [],
  perceptions: [],
};

function formatDateValue(value?: Date | null): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
}

function mapRetentionValues(items: VoucherRetention[]) {
  return items.map((item) => ({
    retentionConceptId: item.retentionConceptId || "",
    taxJurisdictionId: item.taxJurisdictionId || item.taxJurisdiction?.id || "",
    amount: typeof item.amount === "number" ? item.amount : Number(item.amount?.toString() || 0),
  }));
}

function mapPerceptionValues(items: VoucherPerception[]) {
  return items.map((item) => ({
    perceptionConceptId: item.perceptionConceptId || "",
    taxJurisdictionId: item.taxJurisdictionId || item.taxJurisdiction?.id || "",
    amount: typeof item.amount === "number" ? item.amount : Number(item.amount?.toString() || 0),
  }));
}

function buildInitialValues(initialVoucher: Voucher | null | undefined): VoucherFormValues {
  if (!initialVoucher) {
    return defaultFormValues;
  }

  return {
    date: formatDateValue(initialVoucher.date),
    voucherTypeId: initialVoucher.voucherTypeId,
    voucherLetterId: initialVoucher.voucherLetterId,
    posNumber: initialVoucher.posNumber,
    number: initialVoucher.number,
    thirdPartyId: initialVoucher.type === "sale" ? initialVoucher.clientId || "" : initialVoucher.supplierId || "",
    thirdPartyCuit: initialVoucher.type === "sale" ? initialVoucher.client?.cuit || "" : initialVoucher.supplier?.cuit || "",
    currency: initialVoucher.currency === "USD" ? "USD" : "$",
    subtotal: Number(initialVoucher.subtotal || 0),
    vatAmount: Number(initialVoucher.vatAmount || 0),
    nonTaxableAmount: Number(initialVoucher.nonTaxableAmount || 0),
    exemptAmount: Number(initialVoucher.exemptAmount || 0),
    otherTaxesAmount: Number(initialVoucher.otherTaxesAmount || 0),
    totalAmount: Number(initialVoucher.totalAmount || 0),
    concept: initialVoucher.concept || "",
    paymentMethod: initialVoucher.paymentMethod || "",
    status: initialVoucher.status || "pending",
    paymentDate: formatDateValue(initialVoucher.paymentDate),
    paidAmount: Number(initialVoucher.paidAmount || 0),
    comments: initialVoucher.comments || "",
    retentions: mapRetentionValues(initialVoucher.retentions),
    perceptions: mapPerceptionValues(initialVoucher.perceptions),
  };
}

export function useVoucherForm({ isOpen, onOpenChange, type, initialVoucher }: UseVoucherFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [catalogs, setCatalogs] = useState<CatalogState>({
    voucherTypes: [],
    voucherLetters: [],
    retentionConcepts: [],
    perceptionConcepts: [],
    taxJurisdictions: [],
  });
  const [thirdParties, setThirdParties] = useState<{ id: string; name: string; cuit: string }[]>([]);
  const toastManager = useToastManager();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema),
    mode: "onChange",
    defaultValues: defaultFormValues,
  });

  const { control, reset, setValue } = form;

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(buildInitialValues(initialVoucher));

    apiRequest("/api/catalogs")
      .then((response) => response.json())
      .then((data) => setCatalogs(data))
      .catch((error: unknown) => console.error("Error loading catalogs", error));

    const endpoint = type === "sales" ? "/api/clients" : "/api/suppliers";
    apiRequest(endpoint)
      .then((response) => response.json())
      .then((data) => setThirdParties(data))
      .catch((error: unknown) => console.error("Error loading third parties", error));
  }, [initialVoucher, isOpen, reset, type]);

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

  const setNumericValue = (fieldName: NumericVoucherField, value: unknown) => {
    const normalizedValue = typeof value === "number" ? value : Number(value ?? 0);
    setValue(fieldName, normalizedValue, { shouldValidate: true });
  };

  const handleFile = async (file: File) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiRequest("/api/vouchers/parse", {
        method: "POST",
        body: formData,
      });

      const parsedData = await response.json();

      if (parsedData.date) {
        const parsedDate = new Date(parsedData.date);

        if (!isNaN(parsedDate.getTime())) {
          setValue("date", parsedDate.toISOString().split("T")[0], { shouldValidate: true });
        }
      }

      if (parsedData.voucherType) {
        const matchedVoucherType = catalogs.voucherTypes.find(
          (voucherType) => voucherType.name.toLowerCase() === parsedData.voucherType.toLowerCase()
        );

        if (matchedVoucherType) {
          setValue("voucherTypeId", matchedVoucherType.id, { shouldValidate: true });
        }
      }

      if (parsedData.voucherLetter) {
        const matchedVoucherLetter = catalogs.voucherLetters.find(
          (voucherLetter) => voucherLetter.letter.toUpperCase() === parsedData.voucherLetter.toUpperCase()
        );

        if (matchedVoucherLetter) {
          setValue("voucherLetterId", matchedVoucherLetter.id, { shouldValidate: true });
        }
      }

      if (parsedData.posNumber) {
        setValue("posNumber", parsedData.posNumber.padStart(5, "0"), { shouldValidate: true });
      }

      if (parsedData.number) {
        setValue("number", parsedData.number.padStart(8, "0"), { shouldValidate: true });
      }

      if (parsedData.thirdPartyCuit) {
        setValue("thirdPartyCuit", parsedData.thirdPartyCuit, { shouldValidate: true });

        const matchedThirdParty = thirdParties.find((thirdParty) => thirdParty.cuit === parsedData.thirdPartyCuit);
        if (matchedThirdParty) {
          setValue("thirdPartyId", matchedThirdParty.id, { shouldValidate: true });
        }
      }

      if (parsedData.currency === "USD") {
        setValue("currency", "USD", { shouldValidate: true });
      } else if (parsedData.currency) {
        setValue("currency", "$", { shouldValidate: true });
      }

      setNumericValue("subtotal", parsedData.subtotal);
      setNumericValue("vatAmount", parsedData.vatAmount);
      setNumericValue("nonTaxableAmount", parsedData.nonTaxableAmount);
      setNumericValue("exemptAmount", parsedData.exemptAmount);
      setNumericValue("otherTaxesAmount", parsedData.otherTaxesAmount);
      setNumericValue("totalAmount", parsedData.totalAmount);
      setValue("concept", parsedData.concept || "", { shouldValidate: true });
      setValue("paymentMethod", parsedData.paymentMethod || "", { shouldValidate: true });
      setValue("status", parsedData.status || "pending", { shouldValidate: true });
      setValue("paymentDate", parsedData.paymentDate || "", { shouldValidate: true });
      setNumericValue("paidAmount", parsedData.paidAmount);
      setValue("comments", parsedData.comments || "", { shouldValidate: true });
      setValue("retentions", parsedData.retentions ? mapRetentionValues(parsedData.retentions) : [], { shouldValidate: true });
      setValue("perceptions", parsedData.perceptions ? mapPerceptionValues(parsedData.perceptions) : [], { shouldValidate: true });

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
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const onDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFile(event.target.files[0]);
    }
  };

  const onSubmit = () => {
    toastManager.add({
      type: "info",
      title: initialVoucher ? "Edición en preparación" : "Creación deshabilitada",
      description: initialVoucher
        ? "La edición persistente del comprobante se implementará en la próxima funcionalidad."
        : "La creación de comprobantes está deshabilitada en esta etapa.",
    });
    onOpenChange(false);
  };

  const handlePosBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value && /^\d+$/.test(value)) {
      setValue("posNumber", value.padStart(5, "0"), { shouldValidate: true });
    }
  };

  const handleNumberBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value && /^\d+$/.test(value)) {
      setValue("number", value.padStart(8, "0"), { shouldValidate: true });
    }
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
  };
}
