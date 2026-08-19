import {
  buildConciliationPdfZoomLabel,
  canDecreaseConciliationPdfZoom,
  canIncreaseConciliationPdfZoom,
  getConciliationPdfDefaultZoom,
  getConciliationPdfNextZoom,
  getConciliationPdfPreviousZoom,
} from "src/lib/helpers/conciliation-pdf-preview";

describe("conciliation pdf preview helpers", () => {
  it("builds the default zoom label", () => {
    expect(buildConciliationPdfZoomLabel(getConciliationPdfDefaultZoom())).toBe("100%");
  });

  it("caps zoom in and zoom out within the allowed range", () => {
    expect(getConciliationPdfNextZoom(1)).toBe(1.25);
    expect(getConciliationPdfNextZoom(2)).toBe(2);
    expect(getConciliationPdfPreviousZoom(1)).toBe(0.75);
    expect(getConciliationPdfPreviousZoom(0.75)).toBe(0.75);
  });

  it("reports when zoom controls should be enabled", () => {
    expect(canIncreaseConciliationPdfZoom(1)).toBe(true);
    expect(canIncreaseConciliationPdfZoom(2)).toBe(false);
    expect(canDecreaseConciliationPdfZoom(1)).toBe(true);
    expect(canDecreaseConciliationPdfZoom(0.75)).toBe(false);
  });
});
