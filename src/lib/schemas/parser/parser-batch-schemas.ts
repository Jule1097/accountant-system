import { z } from "zod";
import { inputLimits } from "src/lib/constants/input-limits";

const parserVoucherTypeSchema = z.enum(["sale", "purchase"], {
  message: "El tipo de comprobante es inválido.",
});

export const parserBatchUploadSchema = z.object({
  voucherType: parserVoucherTypeSchema,
}).strict();

export const parserBatchStatusQuerySchema = z.object({
  batchId: z.string().uuid("El batch es inválido."),
}).strict();

export const parserBatchRetrySchema = z.object({
  itemId: z.string().uuid("El item es inválido."),
}).strict();

export const parserBulkRetrySchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1).max(inputLimits.maxBulkItemIds),
}).strict();

export type ParserBatchUploadInput = z.infer<typeof parserBatchUploadSchema>;
export type ParserBatchStatusQueryInput = z.infer<typeof parserBatchStatusQuerySchema>;
export type ParserBulkRetryInput = z.infer<typeof parserBulkRetrySchema>;
