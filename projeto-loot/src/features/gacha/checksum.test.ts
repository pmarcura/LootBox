import { describe, it, expect } from "vitest";
import { isValidCode, computeCheckDigit } from "./checksum";
import { normalizeCode } from "./constants";
import { DATA_LENGTH } from "./constants";

describe("computeCheckDigit", () => {
  it("throws for wrong data length", () => {
    expect(() => computeCheckDigit("SHORT")).toThrow("invalid_length");
    expect(() => computeCheckDigit("A".repeat(DATA_LENGTH + 1))).toThrow("invalid_length");
  });

  it("returns a single digit character for valid data", () => {
    const data = "ABCDEFGHJKM"; // 11 chars from alphabet
    const digit = computeCheckDigit(data);
    expect(digit).toMatch(/^[2-9]$/);
  });
});

describe("isValidCode", () => {
  it("returns false for empty or short code", () => {
    expect(isValidCode("")).toBe(false);
    expect(isValidCode("ABC")).toBe(false);
  });

  it("returns false for invalid check digit", () => {
    const validData = "ABCDEFGHJKM";
    const digit = computeCheckDigit(validData);
    const wrongDigit = digit === "2" ? "3" : "2";
    expect(isValidCode(validData + wrongDigit)).toBe(false);
  });

  it("returns true for valid code (data + correct check digit)", () => {
    const data = "ABCDEFGHJKM";
    const digit = computeCheckDigit(data);
    expect(isValidCode(data + digit)).toBe(true);
  });

  it("accepts normalized input (trimmed, uppercase)", () => {
    const data = "abcdefghjkm";
    const digit = computeCheckDigit(normalizeCode(data));
    expect(isValidCode("  " + data.toUpperCase() + digit + "  ")).toBe(true);
  });
});
