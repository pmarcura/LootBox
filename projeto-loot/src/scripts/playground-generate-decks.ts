/**
 * Generates preset decks from the catalog for playground use.
 * Run: npm run playground:generate-decks
 * Output: JSON file with deck definitions (vessel+strain combinations).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (!key || rest.length === 0) continue;
      if (!process.env[key]) {
        process.env[key] = rest.join("=").trim();
      }
    }
  } catch {
    // ignore if .env.local doesn't exist
  }
}

loadEnvLocal();

import { db } from "@/lib/db";
import { collectiblesCatalog, strainsCatalog } from "@/lib/db/schema";
import { previewFusion } from "@/features/fusion/utils/previewFusion";
import type { PlaygroundCard } from "@/features/playground/lib/types";

async function main() {
  const vessels = await db
    .select({
      id: collectiblesCatalog.id,
      name: collectiblesCatalog.name,
      baseHp: collectiblesCatalog.baseHp,
      baseAtk: collectiblesCatalog.baseAtk,
      baseMana: collectiblesCatalog.baseMana,
    })
    .from(collectiblesCatalog);

  const strains = await db
    .select({
      id: strainsCatalog.id,
      name: strainsCatalog.name,
      rarity: strainsCatalog.rarity,
      family: strainsCatalog.family,
    })
    .from(strainsCatalog);

  const rarity =
    (r: string | null): "common" | "uncommon" | "rare" | "epic" | "legendary" =>
      (r as "common" | "uncommon" | "rare" | "epic" | "legendary") ?? "common";

  const family = (f: string | null): "NEURO" | "SHELL" | "PSYCHO" =>
    (f as "NEURO" | "SHELL" | "PSYCHO") ?? "NEURO";

  const decks: { name: string; cards: PlaygroundCard[] }[] = [];
  let cardId = 0;

  const genId = () => `gen-${++cardId}`;

  // Balanced: mix of vessels and strains
  const balancedVessels = vessels.slice(0, 5);
  const balancedStrains = strains.slice(0, 5);
  const balancedCards: PlaygroundCard[] = [];
  for (let i = 0; i < 5; i++) {
    const v = balancedVessels[i] ?? balancedVessels[0]!;
    const s = balancedStrains[i] ?? balancedStrains[0]!;
    const result = previewFusion(
      { baseHp: v.baseHp ?? 0, baseAtk: v.baseAtk ?? 0, baseMana: v.baseMana ?? 0 },
      { rarity: rarity(s.rarity), family: family(s.family) },
    );
    balancedCards.push({
      id: genId(),
      final_hp: result.finalHp,
      final_atk: result.finalAtk,
      mana_cost: result.manaCost,
      keyword: result.keyword,
      image_url: null,
    });
  }
  decks.push({ name: "catalog_balanced", cards: balancedCards });

  // Aggressive: high attack vessels + NEURO
  const neuroStrains = strains.filter((s) => s.family === "NEURO");
  const highAtkVessels = [...vessels].sort((a, b) => (b.baseAtk ?? 0) - (a.baseAtk ?? 0));
  const aggressiveCards: PlaygroundCard[] = [];
  for (let i = 0; i < 5; i++) {
    const v = highAtkVessels[i] ?? highAtkVessels[0]!;
    const s = neuroStrains[i] ?? neuroStrains[0] ?? strains[0]!;
    const result = previewFusion(
      { baseHp: v.baseHp ?? 0, baseAtk: v.baseAtk ?? 0, baseMana: v.baseMana ?? 0 },
      { rarity: rarity(s.rarity), family: family(s.family) },
    );
    aggressiveCards.push({
      id: genId(),
      final_hp: result.finalHp,
      final_atk: result.finalAtk,
      mana_cost: result.manaCost,
      keyword: result.keyword,
      image_url: null,
    });
  }
  decks.push({ name: "catalog_aggressive", cards: aggressiveCards });

  const outputPath = join(process.cwd(), "src", "features", "playground", "lib", "generated-decks.json");
  writeFileSync(outputPath, JSON.stringify(decks, null, 2), "utf-8");
  console.log(`Wrote ${decks.length} decks to ${outputPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
