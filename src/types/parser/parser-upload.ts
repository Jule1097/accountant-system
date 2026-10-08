import { ParserVoucherType } from "src/types/parser/parser-batch"

export interface ParserUploadFileMetadata {
  fileName: string
  mimeType: string
  fileSize: number
}

export interface ParserUploadPlanItem extends ParserUploadFileMetadata {
  itemId: string
  storagePath: string
}

export interface ParserUploadPlan {
  planId: string
  batchId: string
  userId: string
  companyId: string
  voucherType: ParserVoucherType
  expiresAt: number
  items: ParserUploadPlanItem[]
}

export interface ParserUploadPlanInput {
  voucherKind: ParserVoucherType
  files: ParserUploadFileMetadata[]
}

export interface ParserUploadAuthorization {
  itemId: string
  fileName: string
  mimeType: string
  fileSize: number
  path: string
  token: string
}

export interface ParserUploadPlanResponse {
  planToken: string
  expiresAt: string
  bucket: string
  uploads: ParserUploadAuthorization[]
}

export interface ParserUploadConfirmationInput {
  planToken: string
  itemIds: string[]
}

export interface ParserStoredFileMetadata {
  fileSize: number
  mimeType: string
}
