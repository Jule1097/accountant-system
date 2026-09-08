import { Prisma } from "src/generated/prisma/client"

export type VoucherPersistenceRecord = Prisma.VoucherGetPayload<{ include: {
  retentions: { include: { retentionConcept: { select: { name: true } }; taxJurisdiction: { select: { name: true } } } }
  perceptions: { include: { perceptionConcept: { select: { name: true } }; taxJurisdiction: { select: { name: true } } } }
  vatDetails: { include: { vatRate: { select: { name: true } } } }
  voucherType: { select: { name: true } }
  voucherLetter: { select: { letter: true } }
  client: { select: { name: true; cuit: true } }
  supplier: { select: { name: true; cuit: true } }
} }>
