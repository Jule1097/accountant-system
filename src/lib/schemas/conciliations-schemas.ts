import { z } from "zod";

export const conciliationsQuerySchema = z.object({
  batchId: z.string().uuid("El lote es inválido.").optional(),
  tab: z.enum(["sales", "purchases"], {
    message: "La pestaña es inválida.",
  }),
  page: z.coerce.number().int().min(1, "La página es inválida."),
});

export const conciliationItemParamsSchema = z.object({
  itemId: z.string().uuid("El ítem es inválido."),
});

export const conciliationBulkDiscardSchema = z.object({
  itemIds: z.array(z.string().uuid("El ítem es inválido.")).min(1, "Debe seleccionar al menos una factura."),
});

export type ConciliationsQueryInput = z.infer<typeof conciliationsQuerySchema>;
export type ConciliationItemParamsInput = z.infer<typeof conciliationItemParamsSchema>;
export type ConciliationBulkDiscardInput = z.infer<typeof conciliationBulkDiscardSchema>;
