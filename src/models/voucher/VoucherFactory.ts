import { validateVoucherCreationInput } from "src/lib/helpers/voucher/voucher-invariants"
import { UnsupportedVoucherTypeError } from "src/lib/errors/voucher/voucher-errors"
import { Purchase } from "src/models/voucher/Purchase"
import { Sale } from "src/models/voucher/Sale"
import { Voucher } from "src/models/voucher/Voucher"
import { voucherTypeValues } from "src/lib/constants/voucher"
import type { PurchaseVoucherInput, SaleVoucherInput, VoucherFactoryInput } from "src/types/voucher/domain"

function toSaleVoucherInput(input: VoucherFactoryInput): SaleVoucherInput {
  return { ...input, type: voucherTypeValues.sale, clientId: input.clientId ?? null, client: input.client ?? null, retentions: input.retentions ?? [], perceptions: [] }
}

function toPurchaseVoucherInput(input: VoucherFactoryInput): PurchaseVoucherInput {
  return { ...input, type: voucherTypeValues.purchase, supplierId: input.supplierId ?? null, supplier: input.supplier ?? null, retentions: [], perceptions: input.perceptions ?? [] }
}

export class VoucherFactory {
  static create(input: VoucherFactoryInput): Voucher {
    validateVoucherCreationInput(input)
    if (input.type === "sale") return new Sale(toSaleVoucherInput(input))
    if (input.type === "purchase") return new Purchase(toPurchaseVoucherInput(input))
    throw new UnsupportedVoucherTypeError(input.type)
  }

  static rehydrate(input: VoucherFactoryInput): Voucher {
    if (input.type === "sale") return new Sale(toSaleVoucherInput(input), true)
    if (input.type === "purchase") return new Purchase(toPurchaseVoucherInput(input), true)
    throw new UnsupportedVoucherTypeError(input.type)
  }
}
