import { buildConciliationsPageData } from "src/lib/helpers/conciliations";
import { ParserBatchItemContextRecord } from "src/types/parser-batch";

function flattenPageItems(data: ReturnType<typeof buildConciliationsPageData>) {
  return data.sections.flatMap((section) => section.items);
}

function createParserBatchItem(
  parsedPayload: ParserBatchItemContextRecord["parsedPayload"]
): ParserBatchItemContextRecord {
  return {
    id: "item-1",
    batchId: "batch-1",
    fileName: "factura.pdf",
    mimeType: "application/pdf",
    fileSize: 100,
    fileHash: "hash-1",
    storagePath: "batch/item.pdf",
    inputStrategy: "pdf-visual",
    status: "parsed",
    parsedPayload,
    validatedPayload: null,
    currentError: null,
    currentAttempt: 1,
    queuedAt: null,
    processedAt: null,
    expiresAt: "2026-08-18T00:00:00.000Z",
    createdAt: "2026-08-17T00:00:00.000Z",
    updatedAt: "2026-08-17T00:00:00.000Z",
    batch: {
      id: "batch-1",
      companyId: "company-1",
      createdByUserId: "user-1",
      voucherType: "sale",
      status: "processing",
      expiresAt: "2026-08-18T00:00:00.000Z",
    },
  };
}

describe("buildConciliationsPageData", () => {
  it("marks placeholder-only parsed payloads as error", () => {
    const data = buildConciliationsPageData(
      { tab: "sales", page: 1 },
      [
        createParserBatchItem({
          posNumber: "00000",
          number: "00000000",
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
        }),
      ]
    );
    const items = flattenPageItems(data);

    expect(items[0]?.status).toBe("Error");
    expect(items[0]?.canReview).toBe(false);
    expect(items[0]?.canRetry).toBe(true);
    expect(items[0]?.canDiscard).toBe(true);
  });

  it("marks placeholder payloads with only voucher classification data as error", () => {
    const data = buildConciliationsPageData(
      { tab: "sales", page: 1 },
      [
        createParserBatchItem({
          posNumber: "00000",
          number: "00000000",
          date: null,
          currency: "$",
          exchangeRate: 1,
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
          thirdPartyName: "Sin tercero identificado",
          voucherType: "Factura",
          voucherLetter: "C",
          vatDetails: [],
          retentions: [],
          perceptions: [],
          thirdPartyId: null,
        }),
      ]
    );
    const items = flattenPageItems(data);

    expect(items[0]?.documentId).toBe("C 00000-00000000");
    expect(items[0]?.status).toBe("Error");
    expect(items[0]?.canReview).toBe(false);
    expect(items[0]?.canRetry).toBe(true);
  });

  it("allows discarding validated and ready items", () => {
    const readyItem = createParserBatchItem({
      posNumber: "00001",
      number: "00000001",
      date: "2026-08-17",
      currency: "ARS",
      exchangeRate: 1,
      subtotal: 100,
      vatAmount: 21,
      nonTaxableAmount: 0,
      exemptAmount: 0,
      otherTaxesAmount: 0,
      totalAmount: 121,
      concept: "Servicio",
      paymentMethod: null,
      status: null,
      paymentDate: null,
      paidAmount: null,
      comments: null,
      thirdPartyCuit: "30-12345678-9",
      thirdPartyName: "Acme",
      voucherType: "Factura",
      voucherLetter: "A",
      vatDetails: [],
      retentions: [],
      perceptions: [],
      thirdPartyId: null,
    });
    const validatedItem = {
      ...readyItem,
      id: "item-2",
      status: "validated" as const,
    };
    const data = buildConciliationsPageData(
      { tab: "sales", page: 1 },
      [readyItem, validatedItem]
    );
    const items = flattenPageItems(data);

    expect(items.every((item) => item.canDiscard)).toBe(true);
  });
});
