"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToastManager } from "src/components/ui/toast";
import { apiRequest } from "src/lib/api-client";
import { VoucherRetention } from "src/types/voucher";


export const voucherFormSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  voucherTypeId: z.string().min(1, "El tipo de comprobante es obligatorio"),
  voucherLetterId: z.string().min(1, "La letra es obligatoria"),
  posNumber: z.string().regex(/^\d{1,5}$/, "El punto de venta debe tener hasta 5 dígitos"),
  number: z.string().regex(/^\d{1,20}$/, "El número de comprobante debe tener hasta 8 dígitos"),
  thirdPartyId: z.string().min(1, "El cliente o proveedor es obligatorio"),
  thirdPartyCuit: z.string().min(1, "El CUIT es obligatorio"),
  totalAmount: z.number({ message: "Debe ser un número" }).min(0.01, "El total debe ser mayor a 0"),
  retentions: z.array(
    z.object({
      retentionConceptId: z.string().min(1, "Concepto obligatorio"),
      amount: z.number({ message: "Debe ser un número" }).min(0, "No puede ser negativo"),
      province: z.string().optional().nullable(),
    })
  ),
});

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;

export interface UseVoucherFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: "sales" | "purchases";
}

export function useVoucherForm({ isOpen, onOpenChange, type }: UseVoucherFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [catalogs, setCatalogs] = useState<{
    voucherTypes: { id: string; name: string }[];
    voucherLetters: { id: string; letter: string }[];
    retentionConcepts: { id: string; name: string; type: string }[];
  }>({ voucherTypes: [], voucherLetters: [], retentionConcepts: [] });

  const [thirdParties, setThirdParties] = useState<{ id: string; name: string; cuit: string }[]>([]);

  const toastManager = useToastManager();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema),
    mode: "onChange",
    defaultValues: {
      date: "",
      voucherTypeId: "",
      voucherLetterId: "",
      posNumber: "",
      number: "",
      thirdPartyId: "",
      thirdPartyCuit: "",
      retentions: [],
    },
  });

  const { setValue, watch, reset, control } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "retentions",
  });

  const selectedThirdPartyId = watch("thirdPartyId");

  useEffect(() => {
    if (isOpen) {
      reset();
      apiRequest("/api/catalogs")
        .then((res) => res.json())
        .then((data) => setCatalogs(data))
        .catch((err) => console.error("Error loading catalogs", err));

      const endpoint = type === "sales" ? "/api/clients" : "/api/suppliers";
      apiRequest(endpoint)
        .then((res) => res.json())
        .then((data) => setThirdParties(data))
        .catch((err) => console.error("Error loading third parties", err));
    }
  }, [isOpen, type, reset]);

  useEffect(() => {
    if (selectedThirdPartyId) {
      const match = thirdParties.find((tp) => tp.id === selectedThirdPartyId);
      if (match) {
        setValue("thirdPartyCuit", match.cuit, { shouldValidate: true });
      }
    }
  }, [selectedThirdPartyId, thirdParties, setValue]);

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

      if (parsedData) {
        if (parsedData.date) {
          const parsedDate = new Date(parsedData.date);
          if (!isNaN(parsedDate.getTime())) {
            const formattedDate = parsedDate.toISOString().split("T")[0];
            setValue("date", formattedDate, { shouldValidate: true });
          }
        }
        if (parsedData.voucherType) {
          const matched = catalogs.voucherTypes.find(
            (vt) => vt.name.toLowerCase() === parsedData.voucherType.toLowerCase()
          );
          if (matched) setValue("voucherTypeId", matched.id, { shouldValidate: true });
        }
        if (parsedData.voucherLetter) {
          const matched = catalogs.voucherLetters.find(
            (vl) => vl.letter.toUpperCase() === parsedData.voucherLetter.toUpperCase()
          );
          if (matched) setValue("voucherLetterId", matched.id, { shouldValidate: true });
        }
        if (parsedData.posNumber) {
          setValue("posNumber", parsedData.posNumber.padStart(5, "0"), { shouldValidate: true });
        }
        if (parsedData.number) {
          setValue("number", parsedData.number.padStart(8, "0"), { shouldValidate: true });
        }
        if (parsedData.thirdPartyCuit) {
          const cleanCuit = parsedData.thirdPartyCuit;
          setValue("thirdPartyCuit", cleanCuit, { shouldValidate: true });

          const matchedThirdParty = thirdParties.find((tp) => tp.cuit === cleanCuit);
          if (matchedThirdParty) {
            setValue("thirdPartyId", matchedThirdParty.id, { shouldValidate: true });
          }
        }
        if (parsedData.totalAmount) {
          setValue("totalAmount", Number(parsedData.totalAmount), { shouldValidate: true });
        }
        if (parsedData.retentions) {
          const mapped = parsedData.retentions.map((r: VoucherRetention) => ({
            retentionConceptId: r.retentionConceptId || "",
            amount: typeof r.amount === 'number' ? r.amount : Number(r.amount?.toString() || 0),
            province: r.province || "",
          }));
          setValue("retentions", mapped, { shouldValidate: true });
        } else {
          setValue("retentions", [], { shouldValidate: true });
        }

        toastManager.add({
          type: "success",
          title: "Procesamiento completado",
          description: "Los campos detectados se completaron de manera automática.",
        });
      }
    } catch (err) {
      console.error(err);
      toastManager.add({
        type: "error",
        title: "Error al procesar",
        description: "No se pudo procesar el comprobante por IA.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onSubmit = () => {
    toastManager.add({
      type: "info",
      title: "Creación deshabilitada",
      description: "La creación de comprobantes está deshabilitada en esta etapa.",
    });
    onOpenChange(false);
  };

  const handlePosBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && /^\d+$/.test(val)) {
      setValue("posNumber", val.padStart(5, "0"), { shouldValidate: true });
    }
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && /^\d+$/.test(val)) {
      setValue("number", val.padStart(8, "0"), { shouldValidate: true });
    }
  };

  return {
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
  };
}
