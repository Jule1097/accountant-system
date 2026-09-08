import { formatLocalizedDecimal, parseLocalizedDecimal } from "src/lib/helpers/platform/formatting";

describe("localized decimal formatting", () => {
  it("formats values with Argentine separators and two decimals", () => {
    expect(formatLocalizedDecimal(200.5)).toBe("200,50");
    expect(formatLocalizedDecimal(1234.5)).toBe("1.234,50");
  });

  it("parses localized values into backend-compatible numbers", () => {
    expect(parseLocalizedDecimal("1.234,50")).toBe(1234.5);
    expect(parseLocalizedDecimal("200.50")).toBe(200.5);
  });
});
