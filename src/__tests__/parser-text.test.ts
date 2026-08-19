import { hasCorruptedParserText, normalizeParserText } from "src/lib/helpers/parser-text";
import { hasParserMarkdownContent } from "src/lib/helpers/parser-pdf";

describe("parser text normalization", () => {
  it("normalizes composed unicode text to NFC", () => {
    expect(normalizeParserText("Compan\u0303i\u0301a")).toBe("Compañía");
  });

  it("flags extracted markdown with replacement characters as corrupted", () => {
    expect(hasCorruptedParserText("Aseguradora de Cr�ditos")).toBe(true);
    expect(
      hasParserMarkdownContent(
        "Factura A\nCliente: Aseguradora de Cr�ditos\nConcepto: Comisi�n mensual de agosto\nDetalle adicional de prueba\nTotal: 1000"
      )
    ).toBe(true);
  });
});
