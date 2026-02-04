import { describe, it, expect } from "vitest";
import { getEssenceForRarity } from "./essence";

describe("getEssenceForRarity", () => {
  it("returns correct essence for each rarity", () => {
    expect(getEssenceForRarity("common")).toBe(5);
    expect(getEssenceForRarity("uncommon")).toBe(15);
    expect(getEssenceForRarity("rare")).toBe(50);
    expect(getEssenceForRarity("epic")).toBe(150);
    expect(getEssenceForRarity("legendary")).toBe(500);
  });

  it("returns 5 for unknown rarity", () => {
    expect(getEssenceForRarity("unknown")).toBe(5);
    expect(getEssenceForRarity("")).toBe(5);
  });
});
