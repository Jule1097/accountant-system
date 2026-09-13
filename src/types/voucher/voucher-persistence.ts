import { Prisma } from "src/generated/prisma/client"
import { VoucherDocumentIdentificationMode } from "src/types/voucher/domain"

type VoucherPersistenceRecordData = Prisma.VoucherGetPayload<{ include: {
  retentions: { include: { retentionConcept: { select: { name: true } }; taxJurisdiction: { select: { name: true } } } }
  perceptions: { include: { perceptionConcept: { select: { name: true } }; taxJurisdiction: { select: { name: true } } } }
  vatDetails: { include: { vatRate: { select: { name: true } } } }
  voucherType: { select: { name: true; applicability: true } }
  voucherLetter: { select: { letter: true } }
  client: { select: { name: true; cuit: true } }
  supplier: { select: { name: true; cuit: true; taxIdentificationMode: true } }
} }>

export type VoucherPersistenceRecord = Omit<VoucherPersistenceRecordData, "documentIdentificationMode" | "voucherType" | "supplier"> & {
  documentIdentificationMode?: VoucherDocumentIdentificationMode | string
  voucherType: { name: string; applicability?: string }
  supplier: { name: string; cuit: string | null; taxIdentificationMode?: string } | null
}
