"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { catalog } from "@/lib/db/schema";
import { requireAdmin } from "../utils";

const strainFamilyEnum = z.enum(["NEURO", "SHELL", "PSYCHO"]);
const rarityEnum = z.enum(["common", "uncommon", "rare", "epic", "legendary"]);

const strainSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(3),
  name: z.string().min(2),
  rarity: rarityEnum,
  family: strainFamilyEnum,
  image_url: z.string().optional().nullable(),
});

function parseStrainForm(formData: FormData) {
  return strainSchema.parse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    name: formData.get("name"),
    rarity: formData.get("rarity"),
    family: formData.get("family"),
    image_url: formData.get("image_url") || undefined,
  });
}

export async function createStrainAction(formData: FormData) {
  await requireAdmin();
  const payload = parseStrainForm(formData);

  await db.insert(catalog).values({
    type: "strain",
    slug: payload.slug,
    name: payload.name,
    rarity: payload.rarity,
    imageUrl: payload.image_url ?? null,
    attributes: {
      family: payload.family,
    },
  });

  revalidatePath("/admin");
}

export async function updateStrainAction(formData: FormData) {
  await requireAdmin();
  const payload = parseStrainForm(formData);
  if (!payload.id) {
    throw new Error("ID ausente.");
  }

  const [existing] = await db
    .select({ attributes: catalog.attributes })
    .from(catalog)
    .where(eq(catalog.id, payload.id))
    .limit(1);

  const prev = (existing?.attributes as Record<string, unknown>) ?? {};
  const attributes = { ...prev, family: payload.family };

  await db
    .update(catalog)
    .set({
      slug: payload.slug,
      name: payload.name,
      rarity: payload.rarity,
      imageUrl: payload.image_url ?? null,
      attributes,
      updatedAt: new Date(),
    })
    .where(eq(catalog.id, payload.id));

  revalidatePath("/admin");
}

export async function deleteStrainAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("ID inválido.");
  }

  await db.delete(catalog).where(eq(catalog.id, id));

  revalidatePath("/admin");
}
