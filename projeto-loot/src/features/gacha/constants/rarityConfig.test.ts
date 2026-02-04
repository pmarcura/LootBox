import { describe, it, expect } from "vitest";
import { getMaxRarity } from "./rarityConfig";
import type { Rarity } from "../types";

describe("getMaxRarity", () => {
  const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

  it("returns the higher rarity when first is lower", () => {
    expect(getMaxRarity("common", "legendary")).toBe("legendary");
    expect(getMaxRarity("uncommon", "rare")).toBe("rare");
    expect(getMaxRarity("rare", "epic")).toBe("epic");
  });

  it("returns the higher rarity when second is lower", () => {
    expect(getMaxRarity("legendary", "common")).toBe("legendary");
    expect(getMaxRarity("epic", "uncommon")).toBe("epic");
  });

  it("returns either when both are equal", () => {
    for (const r of rarities) {
      expect(getMaxRarity(r, r)).toBe(r);
    }
  });
});
