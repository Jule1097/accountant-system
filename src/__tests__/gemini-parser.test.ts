import { GeminiParsedVoucher } from "src/models/GeminiParsedVoucher";

describe("GeminiParsedVoucher", () => {
  it("matches abbreviated perception names to catalog concepts", () => {
    const parsedVoucher = new GeminiParsedVoucher({
      perceptions: [
        {
          conceptName: "Perc. IIBB CABA",
          amount: 1500,
          province: "CABA",
        },
      ],
    });

    const response = parsedVoucher.toResponse(
      {
        vatRates: [],
        retentionConcepts: [],
        perceptionConcepts: [
          { id: "per-iibb", name: "Percepción de Ingresos Brutos" },
          { id: "per-iva", name: "Percepción de IVA" },
        ],
        taxJurisdictions: [
          { id: "jur-caba", name: "CABA" },
        ],
      },
      null
    );

    expect(response.perceptions).toEqual([
      expect.objectContaining({
        perceptionConceptId: "per-iibb",
        taxJurisdictionId: "jur-caba",
        amount: 1500,
      }),
    ]);
  });

  it("normalizes USD invoices with their exchange rate", () => {
    const parsedVoucher = new GeminiParsedVoucher({
      currency: "USD",
      exchangeRate: 1125.75,
    });

    const response = parsedVoucher.toResponse(
      {
        vatRates: [],
        retentionConcepts: [],
        perceptionConcepts: [],
        taxJurisdictions: [],
      },
      null,
    );

    expect(response.currency).toBe("USD");
    expect(response.exchangeRate).toBe(1125.75);
  });

  it("normalizes unicode-composed text values from parsed content", () => {
    const parsedVoucher = new GeminiParsedVoucher({
      thirdPartyCuit: "30-12345678-9",
      thirdPartyName: "Compan\u0303i\u0301a de Seguros",
      concept: "Comisio\u0301n",
    });

    const response = parsedVoucher.toResponse(
      {
        vatRates: [],
        retentionConcepts: [],
        perceptionConcepts: [],
        taxJurisdictions: [],
      },
      null,
    );

    expect(response.thirdPartyName).toBe("Compañía de Seguros");
    expect(response.concept).toBe("Comisión");
  });

  it("preserves the exact FCE voucher type and normalizes the voucher letter to a single valid letter", () => {
    const parsedVoucher = new GeminiParsedVoucher({
      voucherType: "Factura de Crédito Electrónica MiPyME (FCE)",
      voucherLetter: "Letra A",
    });

    const response = parsedVoucher.toResponse(
      {
        vatRates: [],
        retentionConcepts: [],
        perceptionConcepts: [],
        taxJurisdictions: [],
      },
      null,
    );

    expect(response.voucherType).toBe("Factura de Crédito Electrónica MiPyME (FCE)");
    expect(response.voucherLetter).toBe("A");
  });

  it.each([
    { voucherType: "Factura", voucherLetter: "Letra B", expectedLetter: "B" },
    { voucherType: "Factura", voucherLetter: "Letra C", expectedLetter: "C" },
    { voucherType: "Factura", voucherLetter: "Letra M", expectedLetter: "M" },
    { voucherType: "Factura B", voucherLetter: undefined, expectedLetter: "B" },
    { voucherType: "Factura C", voucherLetter: undefined, expectedLetter: "C" },
    { voucherType: "Factura M", voucherLetter: undefined, expectedLetter: "M" },
    { voucherType: "Factura de Crédito Electrónica MiPyME (FCE) B", voucherLetter: undefined, expectedLetter: "B" },
  ])("normalizes voucher letters across common parsed formats: $voucherType / $voucherLetter", ({ voucherType, voucherLetter, expectedLetter }) => {
    const parsedVoucher = new GeminiParsedVoucher({
      voucherType,
      voucherLetter,
    });

    const response = parsedVoucher.toResponse(
      {
        vatRates: [],
        retentionConcepts: [],
        perceptionConcepts: [],
        taxJurisdictions: [],
      },
      null,
    );

    expect(response.voucherLetter).toBe(expectedLetter);
  });
});
