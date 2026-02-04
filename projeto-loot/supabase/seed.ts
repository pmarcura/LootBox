import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

import { z } from "zod";

import { requireSupabaseAdminEnv } from "../src/lib/supabase/env-validation";
import { createSupabaseAdminClient } from "../src/scripts/supabase-admin";

const rarityEnum = z.enum(["common", "uncommon", "rare", "epic", "legendary"]);

const collectibleSchema = z.object({
  slug: z.string().min(3),
  name: z.string().min(2),
  rarity: rarityEnum,
  base_hp: z.number().int().min(0).optional().default(0),
  base_atk: z.number().int().min(0).optional().default(0),
  base_mana: z.number().int().min(0).optional().default(0),
  series: z.string().optional().nullable(),
  model_key: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  lore: z.string().optional().nullable(),
  flavor_text: z.string().optional().nullable(),
});

const strainFamilyEnum = z.enum(["NEURO", "SHELL", "PSYCHO"]);

const strainSchema = z.object({
  slug: z.string().min(3),
  name: z.string().min(2),
  rarity: rarityEnum,
  family: strainFamilyEnum,
  description: z.string().optional().nullable(),
  penalty: z.string().optional().nullable(),
});

const seasonSchema = z.object({
  schemaVersion: z.number(),
  season: z.string().min(1),
  collectibles: z.array(collectibleSchema).min(1),
  strains: z.array(strainSchema).optional().default([]),
});

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
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
    // ignora se .env.local não existir
  }
}

async function loadSeasonData() {
  const filePath = path.join(process.cwd(), "supabase", "data", "season01.json");
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return seasonSchema.parse(parsed);
}

async function main() {
  loadEnvLocal();
  requireSupabaseAdminEnv();

  const data = await loadSeasonData();
  const supabase = createSupabaseAdminClient();

  const vesselRows = data.collectibles.map((item) => ({
    type: "vessel",
    slug: item.slug,
    name: item.name,
    rarity: item.rarity,
    image_url: item.image_url ?? null,
    attributes: {
      base_hp: item.base_hp ?? 0,
      base_atk: item.base_atk ?? 0,
      base_mana: item.base_mana ?? 0,
      series: item.series ?? null,
      model_key: item.model_key ?? null,
      lore: item.lore ?? null,
      flavor_text: item.flavor_text ?? null,
    },
  }));

  const { error: vesselsError } = await supabase
    .from("catalog")
    .upsert(vesselRows, { onConflict: "type,slug" });

  if (vesselsError) {
    throw new Error(`Falha no seed vessels: ${vesselsError.message}`);
  }

  const strainRows = data.strains.map((item) => ({
    type: "strain",
    slug: item.slug,
    name: item.name,
    rarity: item.rarity,
    image_url: null,
    attributes: {
      family: item.family,
      description: item.description ?? null,
      penalty: item.penalty ?? null,
    },
  }));

  if (strainRows.length > 0) {
    const { error: strainsError } = await supabase
      .from("catalog")
      .upsert(strainRows, { onConflict: "type,slug" });

    if (strainsError) {
      throw new Error(`Falha no seed strains: ${strainsError.message}`);
    }
  }

  console.log(
    `Seed concluído: ${data.collectibles.length} vessels, ${data.strains.length} strains em ${data.season}.`,
  );

  process.exit(0);
}

main().catch((error) => {
  console.error("Falha no seed:", error);
  process.exit(1);
});
