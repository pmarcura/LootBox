"use server";

import { db } from "@/lib/db";
import { collectiblesCatalog, strainsCatalog } from "@/lib/db/schema";

export type CatalogVessel = {
  id: string;
  slug: string;
  name: string;
  rarity: string;
  baseHp: number;
  baseAtk: number;
  baseMana: number;
  imageUrl: string | null;
};

export type CatalogStrain = {
  id: string;
  slug: string;
  name: string;
  rarity: string;
  family: string;
  imageUrl: string | null;
};

export type PlaygroundCatalog = {
  vessels: CatalogVessel[];
  strains: CatalogStrain[];
};

/**
 * Fetch collectibles and strains catalog for the playground deck builder.
 * No auth required - playground is a dev/test tool.
 */
export async function getPlaygroundCatalog(): Promise<PlaygroundCatalog | null> {
  try {
    const [vessels, strains] = await Promise.all([
      db
        .select({
          id: collectiblesCatalog.id,
          slug: collectiblesCatalog.slug,
          name: collectiblesCatalog.name,
          rarity: collectiblesCatalog.rarity,
          baseHp: collectiblesCatalog.baseHp,
          baseAtk: collectiblesCatalog.baseAtk,
          baseMana: collectiblesCatalog.baseMana,
          imageUrl: collectiblesCatalog.imageUrl,
        })
        .from(collectiblesCatalog)
        .orderBy(collectiblesCatalog.rarity, collectiblesCatalog.name),
      db
        .select({
          id: strainsCatalog.id,
          slug: strainsCatalog.slug,
          name: strainsCatalog.name,
          rarity: strainsCatalog.rarity,
          family: strainsCatalog.family,
          imageUrl: strainsCatalog.imageUrl,
        })
        .from(strainsCatalog)
        .orderBy(strainsCatalog.rarity, strainsCatalog.name),
    ]);

    return {
      vessels: vessels.map((v) => ({
        ...v,
        rarity: v.rarity ?? "common",
        baseHp: v.baseHp ?? 0,
        baseAtk: v.baseAtk ?? 0,
        baseMana: v.baseMana ?? 0,
      })),
      strains: strains.map((s) => ({
        ...s,
        rarity: s.rarity ?? "common",
        family: s.family ?? "NEURO",
      })),
    };
  } catch {
    return null;
  }
}
