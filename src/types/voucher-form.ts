import { GeminiParserResponse } from "src/types/gemini-parser";
import { VoucherVatDetail } from "src/types/voucher";

export interface VoucherFormCatalogState {
  voucherTypes: { id: string; name: string }[];
  voucherLetters: { id: string; letter: string }[];
  retentionConcepts: { id: string; name: string; type: string }[];
  perceptionConcepts: { id: string; name: string }[];
  taxJurisdictions: { id: string; name: string }[];
}

export interface VoucherThirdPartyOption {
  id: string;
  name: string;
  cuit: string;
}

export interface VoucherPreviewDocument {
  sourceUrl: string;
  mimeType: string;
  fileName: string;
}

export type VoucherFormDateValue = string | Date;
export type VoucherFormNullableDateValue = string | Date | null;

export interface VoucherFormPayload {
  type: "sale" | "purchase";
  voucherTypeId: string;
  voucherLetterId: string;
  posNumber: string;
  number: string;
  clientId: string | null;
  supplierId: string | null;
  date: VoucherFormDateValue;
  accountingPeriod?: VoucherFormDateValue;
  currency: "$" | "USD";
  exchangeRate: number;
  subtotal: number;
  vatAmount: number;
  nonTaxableAmount: number;
  exemptAmount: number;
  otherTaxesAmount: number;
  totalAmount: number;
  concept?: string;
  paymentMethod: string;
  status: "pending" | "partial" | "paid";
  paymentDate: VoucherFormNullableDateValue;
  paidAmount: number;
  comments?: string;
  createdByUserId: string;
  retentions: {
    retentionConceptId: string;
    taxJurisdictionId?: string | null;
    amount: number;
  }[];
  perceptions: {
    perceptionConceptId: string;
    taxJurisdictionId?: string | null;
    amount: number;
  }[];
  vatDetails: Pick<VoucherVatDetail, "vatRateId" | "subtotal" | "vatAmount">[];
}

export type VoucherParsedData = GeminiParserResponse;
