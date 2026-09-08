import { voucherMoneyErrorMessages } from "src/lib/constants/voucher"
import { InvalidVoucherError } from "src/lib/errors/voucher/voucher-errors"
import { PurchaseVoucherInput, SaleVoucherInput, VoucherFactoryInput } from "src/types/voucher/domain"

export function validateSaleInvariants(input: SaleVoucherInput): void {
  if (!input.clientId) throw new InvalidVoucherError(voucherMoneyErrorMessages.missingSaleClient)
  if (input.perceptions.length > 0) throw new InvalidVoucherError(voucherMoneyErrorMessages.salePerceptions)
}

export function validateVoucherCreationInput(input: VoucherFactoryInput): void {
  if (!input.companyId.trim()) throw new InvalidVoucherError(voucherMoneyErrorMessages.missingCompany)
  if (Number.isNaN(new Date(input.date).getTime())) throw new InvalidVoucherError(voucherMoneyErrorMessages.invalidDate)
  if (!input.currency.trim()) throw new InvalidVoucherError(voucherMoneyErrorMessages.missingVoucherCurrency)
  if (input.type === "sale" && (input.perceptions?.length ?? 0) > 0) throw new InvalidVoucherError(voucherMoneyErrorMessages.salePerceptions)
  if (input.type === "purchase" && (input.retentions?.length ?? 0) > 0) throw new InvalidVoucherError(voucherMoneyErrorMessages.purchaseRetentions)
}

export function validatePurchaseInvariants(input: PurchaseVoucherInput): void {
  if (!input.supplierId) throw new InvalidVoucherError(voucherMoneyErrorMessages.missingPurchaseSupplier)
  if (input.retentions.length > 0) throw new InvalidVoucherError(voucherMoneyErrorMessages.purchaseRetentions)
}
