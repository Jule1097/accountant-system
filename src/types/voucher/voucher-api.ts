import type { VoucherPartySnapshot, VoucherSnapshot } from "src/types/voucher/domain"

export interface VoucherApiTaxAmount {
  retentionConceptId?: string
  perceptionConceptId?: string
  taxJurisdictionId?: string | null
  amount: string
  conceptName?: string | null
  taxJurisdictionName?: string | null
  retentionConcept?: { id: string; name: string; type?: string } | null
  perceptionConcept?: { id: string; name: string } | null
  taxJurisdiction?: { id: string; name: string } | null
}

export interface VoucherApiVatDetail {
  vatRateId?: string
  subtotal?: string
  vatAmount?: string
  amount?: string
  vatRateName?: string | null
}

export interface VoucherApiResponse extends VoucherSnapshot {
  clientId: string | null
  supplierId: string | null
  voucherType: { name: string } | null
  voucherLetter: { letter: string } | null
  client: VoucherPartySnapshot | null
  supplier: VoucherPartySnapshot | null
  retentions: VoucherApiTaxAmount[]
  perceptions: VoucherApiTaxAmount[]
  vatDetails: VoucherApiVatDetail[]
}
