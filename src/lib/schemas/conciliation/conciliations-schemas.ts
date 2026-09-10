import { z } from "zod";
import { inputLimits } from "src/lib/constants/input-limits";

export const conciliationsQuerySchema = z.object({
  batchId: z.string().uuid("El lote es inválido.").optional(),
  tab: z.enum(["sales", "purchases"], {
    message: "La pestaña es inválida.",
  }),
  page: z.coerce.number().int().min(1, "La página es inválida."),
}).strict();

export const conciliationItemParamsSchema = z.object({
  itemId: z.string().uuid("El ítem es inválido."),
}).strict();

export const conciliationBulkDiscardSchema = z.object({
  itemIds: z.array(z.string().uuid("El ítem es inválido.")).min(1, "Debe seleccionar al menos una factura.").max(inputLimits.maxBulkItemIds, "No se pueden procesar más de 1000 facturas por solicitud."),
}).strict();

export const conciliationBulkPersistSchema = z.object({
  itemIds: z.array(z.string().uuid("El ítem es inválido.")).min(1, "Debe seleccionar al menos una factura.").max(inputLimits.maxBulkItemIds, "No se pueden procesar más de 1000 facturas por solicitud."),
}).strict();

export type ConciliationsQueryInput = z.infer<typeof conciliationsQuerySchema>;
export type ConciliationItemParamsInput = z.infer<typeof conciliationItemParamsSchema>;
export type ConciliationBulkDiscardInput = z.infer<typeof conciliationBulkDiscardSchema>;
export type ConciliationBulkPersistInput = z.infer<typeof conciliationBulkPersistSchema>;
