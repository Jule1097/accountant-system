import { z } from "zod";

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

export type ParserBatchUploadInput = z.infer<typeof parserBatchUploadSchema>;
export type ParserBatchStatusQueryInput = z.infer<typeof parserBatchStatusQuerySchema>;
export type ParserBatchRetryInput = z.infer<typeof parserBatchRetrySchema>;
