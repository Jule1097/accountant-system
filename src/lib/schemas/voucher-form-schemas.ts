import * as z from "zod";

function normalizeOptionalNumberInput(value: unknown): number {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return 0;
  }

  return Number(value);
}

const retentionFormSchema = z.object({
  retentionConceptId: z.string().min(1, "Concepto obligatorio"),
  taxJurisdictionId: z.string().optional().nullable(),
  amount: z.number({ message: "Debe ser un numero" }).min(0, "No puede ser negativo"),
});

const perceptionFormSchema = z.object({
  perceptionConceptId: z.string().min(1, "Concepto obligatorio"),
  taxJurisdictionId: z.string().optional().nullable(),
  amount: z.number({ message: "Debe ser un numero" }).min(0, "No puede ser negativo"),
});

export const voucherFormSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  voucherTypeId: z.string().min(1, "El tipo de comprobante es obligatorio"),
  voucherLetterId: z.string().min(1, "La letra es obligatoria"),
  posNumber: z.string().regex(/^\d{1,5}$/, "El punto de venta debe tener hasta 5 digitos"),
  number: z.string().regex(/^\d{1,20}$/, "El numero de comprobante debe tener hasta 20 digitos"),
  thirdPartyId: z.string().min(1, "El cliente o proveedor es obligatorio"),
  thirdPartyCuit: z.string().min(1, "El CUIT es obligatorio"),
  currency: z.enum(["$", "USD"], { message: "La moneda es obligatoria" }),
  subtotal: z.number({ message: "Debe ser un numero" }).min(0, "No puede ser negativo"),
  vatAmount: z.number({ message: "Debe ser un numero" }).min(0, "No puede ser negativo"),
  nonTaxableAmount: z.number({ message: "Debe ser un numero" }).min(0, "No puede ser negativo"),
  exemptAmount: z.number({ message: "Debe ser un numero" }).min(0, "No puede ser negativo"),
  otherTaxesAmount: z.number({ message: "Debe ser un numero" }).min(0, "No puede ser negativo"),
  totalAmount: z.number({ message: "Debe ser un numero" }).min(0.01, "El total debe ser mayor a 0"),
  concept: z.string().optional(),
  paymentMethod: z.string().min(1, "El medio de pago es obligatorio"),
  status: z.enum(["pending", "partial", "paid"], { message: "El estado es obligatorio" }),
  paymentDate: z.string().optional(),
  paidAmount: z.preprocess(
    normalizeOptionalNumberInput,
    z.number({ message: "Debe ser un numero" }).min(0, "No puede ser negativo")
  ),
  comments: z.string().optional(),
  createdByUserId: z.string().min(1, "El usuario es obligatorio"),
  retentions: z.array(retentionFormSchema),
  perceptions: z.array(perceptionFormSchema),
});

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;
