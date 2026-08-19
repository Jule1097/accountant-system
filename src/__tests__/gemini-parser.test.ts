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
});
