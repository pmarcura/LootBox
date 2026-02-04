import { describe, it, expect } from "vitest";
import { normalizeCode, CODE_LENGTH, DATA_LENGTH, ALPHABET } from "./constants";

describe("normalizeCode", () => {
  it("uppercases and trims input", () => {
    expect(normalizeCode("  abc123  ")).toBe("ABC123");
    expect(normalizeCode("xyz")).toBe("XYZ");
  });
});

describe("constants", () => {
  it("CODE_LENGTH is 12", () => expect(CODE_LENGTH).toBe(12));
  it("DATA_LENGTH is 11", () => expect(DATA_LENGTH).toBe(11));
  it("ALPHABET excludes ambiguous chars", () => {
    expect(ALPHABET).not.toMatch(/[O0ILU1]/);
    expect(ALPHABET.length).toBeGreaterThanOrEqual(30);
  });
});
