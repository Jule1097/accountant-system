import { Prisma } from "src/generated/prisma/client"
import { Voucher } from "src/models/voucher/Voucher"
import { VoucherFactory } from "src/models/voucher/VoucherFactory"
import { mapPrismaVoucherToDomainInput } from "src/lib/helpers/voucher/voucher-persistence"

export const voucherInclude = {
  retentions: {
    include: {
      retentionConcept: true,
      taxJurisdiction: true,
    },
  },
  perceptions: {
    include: {
      perceptionConcept: true,
      taxJurisdiction: true,
    },
  },
  vatDetails: {
    include: {
      vatRate: true,
    },
  },
  voucherType: true,
  voucherLetter: true,
  client: true,
  supplier: true,
} satisfies Prisma.VoucherInclude

export function rehydrateVoucher(rawVoucher: Prisma.VoucherGetPayload<{ include: typeof voucherInclude }>): Voucher {
  return VoucherFactory.rehydrate(mapPrismaVoucherToDomainInput(rawVoucher))
}
