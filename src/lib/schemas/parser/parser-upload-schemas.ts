import { z } from "zod"
import { inputLimits } from "src/lib/constants/input-limits"
import { parserFileValidationMessages } from "src/lib/constants/parser"
import { voucherTypeValues } from "src/lib/constants/voucher"

const parserVoucherTypeSchema = z.enum([voucherTypeValues.sale, voucherTypeValues.purchase], {
  message: "El tipo de comprobante es inválido.",
})

const parserUploadFileMetadataSchema = z.object({
  fileName: z.string().min(1).max(inputLimits.maxNameLength),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
}).strict()

const parserUploadPlanItemSchema = parserUploadFileMetadataSchema.extend({
  itemId: z.string().uuid(),
  storagePath: z.string().min(1),
})

export const parserUploadPlanSchema = z.object({
  voucherKind: parserVoucherTypeSchema,
  files: z.array(parserUploadFileMetadataSchema).min(1).max(inputLimits.maxParserFiles, parserFileValidationMessages.maxFilesExceeded),
}).strict()

export const parserUploadConfirmationSchema = z.object({
  planToken: z.string().min(1),
  itemIds: z.array(z.string().uuid()).min(1).max(inputLimits.maxParserFiles),
}).strict()

export const parserUploadPlanTokenSchema = z.object({
  planId: z.string().uuid(),
  batchId: z.string().uuid(),
  userId: z.string().uuid(),
  companyId: z.string().uuid(),
  voucherType: parserVoucherTypeSchema,
  expiresAt: z.number().int().positive(),
  items: z.array(parserUploadPlanItemSchema).min(1).max(inputLimits.maxParserFiles),
}).strict()

export type ParserUploadPlanInput = z.infer<typeof parserUploadPlanSchema>
export type ParserUploadConfirmationInput = z.infer<typeof parserUploadConfirmationSchema>
