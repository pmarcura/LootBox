"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { catalog } from "@/lib/db/schema";
import { requireAdmin } from "../utils";

const collectibleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(3),
  name: z.string().min(2),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]),
  series: z.string().optional(),
  model_key: z.string().optional(),
  base_hp: z.coerce.number().int().min(0).optional().default(0),
  base_atk: z.coerce.number().int().min(0).optional().default(0),
  base_mana: z.coerce.number().int().min(0).optional().default(0),
});

function parseCollectibleForm(formData: FormData) {
  return collectibleSchema.parse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    name: formData.get("name"),
    rarity: formData.get("rarity"),
    series: formData.get("series") || undefined,
    model_key: formData.get("model_key") || undefined,
    base_hp: formData.get("base_hp"),
    base_atk: formData.get("base_atk"),
    base_mana: formData.get("base_mana"),
  });
}

export async function createCollectibleAction(formData: FormData) {
  await requireAdmin();
  const payload = parseCollectibleForm(formData);

  await db.insert(catalog).values({
    type: "vessel",
    slug: payload.slug,
    name: payload.name,
    rarity: payload.rarity,
    attributes: {
      base_hp: payload.base_hp,
      base_atk: payload.base_atk,
      base_mana: payload.base_mana,
      series: payload.series ?? null,
      model_key: payload.model_key ?? null,
    },
  });

  revalidatePath("/admin");
}

export async function updateCollectibleAction(formData: FormData) {
  await requireAdmin();
  const payload = parseCollectibleForm(formData);
  if (!payload.id) {
    throw new Error("ID ausente.");
  }

  const [existing] = await db
    .select({ attributes: catalog.attributes })
    .from(catalog)
    .where(eq(catalog.id, payload.id))
    .limit(1);

  const prev = (existing?.attributes as Record<string, unknown>) ?? {};
  const attributes = {
    ...prev,
    base_hp: payload.base_hp,
    base_atk: payload.base_atk,
    base_mana: payload.base_mana,
    series: payload.series ?? null,
    model_key: payload.model_key ?? null,
  };

  await db
    .update(catalog)
    .set({
      slug: payload.slug,
      name: payload.name,
      rarity: payload.rarity,
      attributes,
      updatedAt: new Date(),
    })
    .where(eq(catalog.id, payload.id));

  revalidatePath("/admin");
}

export async function deleteCollectibleAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("ID inválido.");
  }

  await db.delete(catalog).where(eq(catalog.id, id));

  revalidatePath("/admin");
}
