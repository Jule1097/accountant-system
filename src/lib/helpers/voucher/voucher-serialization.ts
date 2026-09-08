import { Voucher } from "src/models/voucher/Voucher"
import type { VoucherApiResponse, VoucherApiTaxAmount, VoucherApiVatDetail } from "src/types/voucher/voucher-api"
import type { VoucherListResponse } from "src/types/voucher/voucher"

function mapTaxAmount(item: { amount: string | number; retentionConceptId?: string; perceptionConceptId?: string; taxJurisdictionId?: string | null; conceptName?: string | null; taxJurisdictionName?: string | null }): VoucherApiTaxAmount {
  return { ...item, amount: item.amount.toString() }
}

function mapVatDetail(item: { vatRateId?: string; subtotal?: string | number; vatAmount?: string | number; amount?: string | number; vatRateName?: string | null }): VoucherApiVatDetail {
  return { ...item, subtotal: item.subtotal?.toString(), vatAmount: item.vatAmount?.toString(), amount: item.amount?.toString() }
}

export function serializeVoucher(voucher: Voucher): VoucherApiResponse {
  const snapshot = voucher.toSnapshot()
  const persistenceData = voucher.getPersistenceData()
  const party = voucher.getParty()
  const base = {
    ...snapshot,
    clientId: persistenceData.clientId,
    supplierId: persistenceData.supplierId,
    voucherType: voucher.voucherTypeName ? { name: voucher.voucherTypeName } : null,
    voucherLetter: voucher.voucherLetter ? { letter: voucher.voucherLetter } : null,
    client: voucher.type === "sale" ? party : null,
    supplier: voucher.type === "purchase" ? party : null,
    retentions: persistenceData.retentions.map(mapTaxAmount),
    perceptions: persistenceData.perceptions.map(mapTaxAmount),
    vatDetails: voucher.vatDetails.map(mapVatDetail),
  }

  return base
}

export function serializeVoucherPage(response: VoucherListResponse<Voucher>): VoucherListResponse<VoucherApiResponse> {
  return { ...response, items: response.items.map((item) => ({ ...item, voucher: serializeVoucher(item.voucher) })) }
}
