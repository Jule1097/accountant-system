import { VoucherForm } from "src/models/VoucherForm";
import { Voucher } from "src/models/Voucher";
import { normalizeVoucherFormPayload } from "src/lib/helpers/voucher/voucher-form";
import { VoucherFormValues } from "src/lib/schemas/voucher/voucher-form-schemas";
import { VoucherFormPayload } from "src/types/voucher/voucher-form";
import { VoucherParsedData } from "src/types/voucher/voucher-form";

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

const parsedCatalogs = {
  voucherTypes: [
    { id: "type-invoice", name: "Factura" },
    { id: "type-credit-note", name: "Nota de Crédito" },
    { id: "type-mipyme", name: "Factura de Crédito MiPyME" },
    { id: "type-fce", name: "Factura de Crédito Electrónica MiPyME" },
  ],
  voucherLetters: [
    { id: "letter-a", letter: "A" },
    { id: "letter-b", letter: "B" },
    { id: "letter-c", letter: "C" },
    { id: "letter-m", letter: "M" },
  ],
  retentionConcepts: [],
  perceptionConcepts: [],
  taxJurisdictions: [],
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

describe("VoucherForm.buildParsedPatch", () => {
  function createParsedData(overrides: Partial<VoucherParsedData>): VoucherParsedData {
    return {
      posNumber: null,
      number: null,
      date: null,
      currency: null,
      exchangeRate: null,
      subtotal: null,
      vatAmount: null,
      nonTaxableAmount: null,
      exemptAmount: null,
      otherTaxesAmount: null,
      totalAmount: null,
      concept: null,
      paymentMethod: null,
      status: null,
      paymentDate: null,
      paidAmount: null,
      comments: null,
      thirdPartyCuit: null,
      thirdPartyName: null,
      voucherType: null,
      voucherLetter: null,
      vatDetails: [],
      retentions: [],
      perceptions: [],
      thirdPartyId: null,
      ...overrides,
    };
  }

  function createCurrentValues(): VoucherFormValues {
    return {
      ...purchaseFormValues,
      voucherTypeId: "",
      voucherLetterId: "",
    };
  }

  it("resolves voucher type and letter when AI returns a combined invoice label", () => {
    const result = VoucherForm.buildParsedPatch(
      createParsedData({
        voucherType: "Factura A",
        voucherLetter: null,
      }),
      createCurrentValues(),
      "sales",
      parsedCatalogs,
      [],
    );

    expect(result.voucherTypeId).toBe("type-invoice");
    expect(result.voucherLetterId).toBe("letter-a");
  });

  it("resolves credit note labels that include the invoice letter in the same parsed value", () => {
    const result = VoucherForm.buildParsedPatch(
      createParsedData({
        voucherType: "Nota de Crédito A",
        voucherLetter: null,
      }),
      createCurrentValues(),
      "sales",
      parsedCatalogs,
      [],
    );

    expect(result.voucherTypeId).toBe("type-credit-note");
    expect(result.voucherLetterId).toBe("letter-a");
  });

  it("resolves MiPyME wording variants to the corresponding voucher type", () => {
    const result = VoucherForm.buildParsedPatch(
      createParsedData({
        voucherType: "Factura Crédito MiPyME A",
        voucherLetter: null,
      }),
      createCurrentValues(),
      "sales",
      parsedCatalogs,
      [],
    );

    expect(result.voucherTypeId).toBe("type-mipyme");
    expect(result.voucherLetterId).toBe("letter-a");
  });

  it("resolves the exact FCE label to the electronic credit invoice type", () => {
    const result = VoucherForm.buildParsedPatch(
      createParsedData({
        voucherType: "Factura de Crédito Electrónica MiPyME (FCE)",
        voucherLetter: "A",
      }),
      createCurrentValues(),
      "sales",
      parsedCatalogs,
      [],
    );

    expect(result.voucherTypeId).toBe("type-fce");
    expect(result.voucherLetterId).toBe("letter-a");
  });

  it("does not derive an invalid letter token from the FCE acronym", () => {
    const result = VoucherForm.buildParsedPatch(
      createParsedData({
        voucherType: "Factura de Crédito Electrónica MiPyME (FCE)",
        voucherLetter: null,
      }),
      createCurrentValues(),
      "sales",
      parsedCatalogs,
      [],
    );

    expect(result.voucherTypeId).toBe("type-fce");
    expect(result.voucherLetterId).toBe("");
  });

  it.each([
    { voucherType: "Factura", voucherLetter: "Letra A", expectedLetterId: "letter-a" },
    { voucherType: "Factura", voucherLetter: "Letra B", expectedLetterId: "letter-b" },
    { voucherType: "Factura", voucherLetter: "Letra C", expectedLetterId: "letter-c" },
    { voucherType: "Factura", voucherLetter: "Letra M", expectedLetterId: "letter-m" },
  ])("resolves explicit parsed voucher letters for $voucherLetter", ({ voucherType, voucherLetter, expectedLetterId }) => {
    const result = VoucherForm.buildParsedPatch(
      createParsedData({
        voucherType,
        voucherLetter,
      }),
      createCurrentValues(),
      "sales",
      parsedCatalogs,
      [],
    );

    expect(result.voucherTypeId).toBe("type-invoice");
    expect(result.voucherLetterId).toBe(expectedLetterId);
  });

  it.each([
    { voucherType: "Factura A", expectedLetterId: "letter-a" },
    { voucherType: "Factura B", expectedLetterId: "letter-b" },
    { voucherType: "Factura C", expectedLetterId: "letter-c" },
    { voucherType: "Factura M", expectedLetterId: "letter-m" },
    { voucherType: "Nota de Crédito B", expectedLetterId: "letter-b", expectedTypeId: "type-credit-note" },
    { voucherType: "Factura de Crédito Electrónica MiPyME (FCE) C", expectedLetterId: "letter-c", expectedTypeId: "type-fce" },
  ])("resolves embedded voucher letters from $voucherType", ({ voucherType, expectedLetterId, expectedTypeId }) => {
    const result = VoucherForm.buildParsedPatch(
      createParsedData({
        voucherType,
        voucherLetter: null,
      }),
      createCurrentValues(),
      "sales",
      parsedCatalogs,
      [],
    );

    expect(result.voucherTypeId).toBe(expectedTypeId || "type-invoice");
    expect(result.voucherLetterId).toBe(expectedLetterId);
  });
});

describe("VoucherForm decimal rounding TDD", () => {
  it("should round the resolved subtotal to 2 decimals when total and vat amounts have float precision quirks", () => {
    const subtotal = VoucherForm.resolveSalesSubtotal(
      "sales",
      "letter-b",
      10.1,
      10,
      {
        voucherTypes: [],
        voucherLetters: [{ id: "letter-b", letter: "B" }],
        retentionConcepts: [],
        perceptionConcepts: [],
        taxJurisdictions: [],
      }
    );
    expect(subtotal).toBe(0.1);
  });

  it("rounds float precision numbers to 2 decimal places in buildInitialValues", () => {
    const initialVoucher = {
      subtotal: 10.1234,
      vatAmount: 2.126,
      nonTaxableAmount: 1.0005,
      exemptAmount: 0.1234,
      otherTaxesAmount: 0.126,
      totalAmount: 13.501,
      currency: "ARS",
      exchangeRate: 1,
      retentions: [
        { retentionConceptId: "ret-1", amount: 1.1234 }
      ],
      perceptions: [
        { perceptionConceptId: "per-1", amount: 2.126 }
      ],
    } as unknown as Voucher;
    
    const result = VoucherForm.buildInitialValues(initialVoucher, "user-1");
    expect(result.subtotal).toBe(10.12);
    expect(result.vatAmount).toBe(2.13);
    expect(result.nonTaxableAmount).toBe(1.00);
    expect(result.exemptAmount).toBe(0.12);
    expect(result.otherTaxesAmount).toBe(0.13);
    expect(result.totalAmount).toBe(13.50);
    expect(result.retentions[0].amount).toBe(1.12);
    expect(result.perceptions[0].amount).toBe(2.13);
  });
});

