import { describe, it, expect } from "vitest";
import { previewFusion } from "./previewFusion";

describe("previewFusion", () => {
  const vessel = { baseHp: 4, baseAtk: 4, baseMana: 3 };

  it("NEURO common: HP 50%, ATK unchanged", () => {
    const r = previewFusion(vessel, { rarity: "common", family: "NEURO" });
    expect(r.keyword).toBe("OVERCLOCK");
    expect(r.finalHp).toBe(2); // floor(4*0.5)
    expect(r.finalAtk).toBe(4);
    expect(r.manaCost).toBe(3);
  });

  it("NEURO legendary: HP 90%", () => {
    const r = previewFusion(vessel, { rarity: "legendary", family: "NEURO" });
    expect(r.finalHp).toBe(3); // floor(4*0.9)
    expect(r.finalAtk).toBe(4);
  });

  it("SHELL common: ATK 50%, HP unchanged", () => {
    const r = previewFusion(vessel, { rarity: "common", family: "SHELL" });
    expect(r.keyword).toBe("BLOCKER");
    expect(r.finalHp).toBe(4);
    expect(r.finalAtk).toBe(2);
    expect(r.manaCost).toBe(3);
  });

  it("SHELL legendary: ATK 90%", () => {
    const r = previewFusion(vessel, { rarity: "legendary", family: "SHELL" });
    expect(r.finalAtk).toBe(3); // floor(4*0.9)
  });

  it("PSYCHO common: +3 mana", () => {
    const r = previewFusion(vessel, { rarity: "common", family: "PSYCHO" });
    expect(r.keyword).toBe("VAMPIRISM");
    expect(r.finalHp).toBe(4);
    expect(r.finalAtk).toBe(4);
    expect(r.manaCost).toBe(6); // 3+3
  });

  it("PSYCHO epic: +1 mana, +1 HP", () => {
    const r = previewFusion(vessel, { rarity: "epic", family: "PSYCHO" });
    expect(r.finalHp).toBe(5); // 4+1
    expect(r.manaCost).toBe(4); // 3+1
  });

  it("PSYCHO legendary: no mana bonus", () => {
    const r = previewFusion(vessel, { rarity: "legendary", family: "PSYCHO" });
    expect(r.manaCost).toBe(3);
    expect(r.finalHp).toBe(4);
  });

  it("HP never below 1", () => {
    const lowVessel = { baseHp: 2, baseAtk: 1, baseMana: 0 };
    const r = previewFusion(lowVessel, { rarity: "common", family: "NEURO" });
    expect(r.finalHp).toBe(1); // floor(2*0.5)=1
  });
});
