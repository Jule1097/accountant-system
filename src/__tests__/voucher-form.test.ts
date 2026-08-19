import { VoucherForm } from "src/models/VoucherForm";
import { normalizeVoucherFormPayload } from "src/lib/helpers/voucher-form";
import { VoucherFormValues } from "src/lib/schemas/voucher-form-schemas";
import { VoucherFormPayload } from "src/types/voucher-form";

const basePayload: VoucherFormPayload = {
  type: "sale",
  voucherTypeId: "123e4567-e89b-12d3-a456-426614174000",
  voucherLetterId: "123e4567-e89b-12d3-a456-426614174001",
  posNumber: "00001",
  number: "00000033",
  clientId: "123e4567-e89b-12d3-a456-426614174002",
  supplierId: null,
  date: new Date("2025-06-02T00:00:00.000Z"),
  accountingPeriod: new Date("2025-06-01T00:00:00.000Z"),
  currency: "$",
  exchangeRate: 1,
  subtotal: 100,
  vatAmount: 21,
  nonTaxableAmount: 0,
  exemptAmount: 0,
  otherTaxesAmount: 0,
  totalAmount: 121,
  concept: "Servicio",
  paymentMethod: "Transferencia",
  status: "pending",
  paymentDate: null,
  paidAmount: 0,
  comments: "Observación",
  createdByUserId: "123e4567-e89b-12d3-a456-426614174003",
  retentions: [],
  perceptions: [],
  vatDetails: [],
};

const formCatalogs = {
  voucherTypes: [{ id: "type-1", name: "Factura" }],
  voucherLetters: [{ id: "letter-c", letter: "C" }],
  retentionConcepts: [],
  perceptionConcepts: [{ id: "perception-1", name: "Ingresos Brutos" }],
  taxJurisdictions: [{ id: "jurisdiction-1", name: "Santa Fe" }],
};

const purchaseFormValues: VoucherFormValues = {
  date: "2026-08-18",
  voucherTypeId: "type-1",
  voucherLetterId: "letter-c",
  posNumber: "00003",
  number: "00000456",
  thirdPartyId: "supplier-1",
  thirdPartyCuit: "30716165791",
  currency: "$",
  exchangeRate: 1,
  subtotal: 100,
  vatAmount: 21,
  nonTaxableAmount: 0,
  exemptAmount: 0,
  otherTaxesAmount: 0,
  totalAmount: 121,
  concept: "Honorarios",
  paymentMethod: "Transferencia",
  status: "pending",
  paymentDate: "",
  paidAmount: 0,
  comments: "Observacion",
  createdByUserId: "user-1",
  retentions: [{ retentionConceptId: "retention-1", taxJurisdictionId: "jurisdiction-1", amount: 10 }],
  perceptions: [{ perceptionConceptId: "perception-1", taxJurisdictionId: "jurisdiction-1", amount: 12 }],
};

describe("normalizeVoucherFormPayload", () => {
  it("serializes valid date fields to ISO strings", () => {
    const result = normalizeVoucherFormPayload(basePayload);

    expect(result.date).toBe("2025-06-02T00:00:00.000Z");
    expect(result.accountingPeriod).toBe("2025-06-01T00:00:00.000Z");
    expect(result.paymentDate).toBeNull();
  });

  it("drops an invalid accounting period so it can be derived later", () => {
    const result = normalizeVoucherFormPayload({
      ...basePayload,
      accountingPeriod: "Invalid Date",
    });

    expect(result.accountingPeriod).toBeUndefined();
    expect(result.date).toBe("2025-06-02T00:00:00.000Z");
  });
});

describe("VoucherForm.buildPayload", () => {
  it("preserves purchase voucher identifiers and maps the supplier correctly", () => {
    const result = VoucherForm.buildPayload(purchaseFormValues, "purchases", formCatalogs);

    expect(result.type).toBe("purchase");
    expect(result.posNumber).toBe("00003");
    expect(result.number).toBe("00000456");
    expect(result.clientId).toBeNull();
    expect(result.supplierId).toBe("supplier-1");
    expect(result.exchangeRate).toBe(1);
    expect(result.retentions).toEqual([]);
    expect(result.perceptions).toEqual([
      {
        perceptionConceptId: "perception-1",
        taxJurisdictionId: "jurisdiction-1",
        amount: 12,
      },
    ]);
  });

  it("preserves the parsed exchange rate for foreign-currency vouchers", () => {
    const result = VoucherForm.buildPayload(
      {
        ...purchaseFormValues,
        currency: "USD",
        exchangeRate: 1087.45,
      },
      "purchases",
      formCatalogs,
    );

    expect(result.currency).toBe("USD");
    expect(result.exchangeRate).toBe(1087.45);
  });
});
