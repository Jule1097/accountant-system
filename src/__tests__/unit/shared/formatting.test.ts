import { roundToTwoDecimals } from "src/lib/helpers/platform/formatting";

describe("roundToTwoDecimals", () => {
  it("should round normal floats to 2 decimal places", () => {
    expect(roundToTwoDecimals(10.123)).toBe(10.12);
    expect(roundToTwoDecimals(10.126)).toBe(10.13);
  });

  it("should handle floating point subtraction/addition quirks correctly", () => {
    // 10.1 - 10 is 0.09999999999999964 in standard float precision
    expect(10.1 - 10).not.toBe(0.1);
    expect(roundToTwoDecimals(10.1 - 10)).toBe(0.1);
  });

  it("should handle zero correctly", () => {
    expect(roundToTwoDecimals(0)).toBe(0);
  });

  it("should handle negative numbers correctly", () => {
    expect(roundToTwoDecimals(-10.126)).toBe(-10.13);
    expect(roundToTwoDecimals(-10.123)).toBe(-10.12);
  });

  it("should handle integers correctly without changing them", () => {
    expect(roundToTwoDecimals(5)).toBe(5);
  });
});
