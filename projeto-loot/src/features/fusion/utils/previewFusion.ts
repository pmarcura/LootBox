/**
 * Client-side preview of fusion result. Mirrors the fuse_card RPC logic
 * (NEURO/SHELL/PSYCHO multipliers and bonuses) so we can show "before → after" without a round-trip.
 */

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type StrainFamily = "NEURO" | "SHELL" | "PSYCHO";

export type VesselPreview = {
  baseHp: number;
  baseAtk: number;
  baseMana: number;
};

export type StrainPreview = {
  rarity: Rarity;
  family: StrainFamily;
};

export type FusionPreviewResult = {
  finalHp: number;
  finalAtk: number;
  manaCost: number;
  keyword: string;
};

const HP_MULT_BY_RARITY: Record<Rarity, number> = {
  common: 0.5,
  uncommon: 0.6,
  rare: 0.7,
  epic: 0.8,
  legendary: 0.9,
};

export function previewFusion(
  vessel: VesselPreview,
  strain: StrainPreview,
): FusionPreviewResult {
  const { baseHp, baseAtk, baseMana } = vessel;
  const { rarity, family } = strain;
  const r = rarity in HP_MULT_BY_RARITY ? (rarity as Rarity) : "common";

  let keyword: string;
  let hpMult: number;
  let atkMult: number;
  let manaBonus: number;
  let hpBonus: number;

  switch (family) {
    case "NEURO":
      keyword = "OVERCLOCK";
      hpMult = HP_MULT_BY_RARITY[r];
      atkMult = 1;
      manaBonus = 0;
      hpBonus = 0;
      break;
    case "SHELL":
      keyword = "BLOCKER";
      hpMult = 1;
      atkMult = HP_MULT_BY_RARITY[r];
      manaBonus = 0;
      hpBonus = 0;
      break;
    case "PSYCHO":
      keyword = "VAMPIRISM";
      hpMult = 1;
      atkMult = 1;
      manaBonus =
        r === "common"
          ? 3
          : r === "uncommon"
            ? 2
            : r === "rare"
              ? 1
              : r === "epic"
                ? 1
                : 0;
      hpBonus = r === "epic" ? 1 : 0;
      break;
    default:
      keyword = "OVERCLOCK";
      hpMult = 0.5;
      atkMult = 1;
      manaBonus = 0;
      hpBonus = 0;
  }

  const finalHp = Math.max(1, Math.floor(baseHp * hpMult) + hpBonus);
  const finalAtk = Math.max(0, Math.floor(baseAtk * atkMult));
  const manaCost = Math.max(0, baseMana + manaBonus);

  return { finalHp, finalAtk, manaCost, keyword };
}
