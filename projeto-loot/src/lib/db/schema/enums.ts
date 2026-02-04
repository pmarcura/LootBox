import { pgEnum } from "drizzle-orm/pg-core";

export const rarityEnum = pgEnum("rarity", [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
]);

export const strainFamilyEnum = pgEnum("strain_family", [
  "NEURO",
  "SHELL",
  "PSYCHO",
]);

export type Rarity = (typeof rarityEnum.enumValues)[number];
export type StrainFamily = (typeof strainFamilyEnum.enumValues)[number];
