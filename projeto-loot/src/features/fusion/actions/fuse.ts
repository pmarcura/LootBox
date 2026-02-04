"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { getDbWithAuth } from "@/lib/db";
import {
  userInventory,
  userStrains,
  userCards,
  collectiblesCatalog,
  strainsCatalog,
  redemptionCodes,
  auditInventoryLedger,
  auditStrainsLedger,
} from "@/lib/db/schema";
import { previewFusion } from "../utils/previewFusion";

const fuseSchema = z.object({
  vesselInventoryId: z.string().uuid(),
  userStrainId: z.string().uuid(),
});

export type FuseState =
  | { status: "idle" }
  | {
      status: "success";
      tokenId: string;
      finalHp: number;
      finalAtk: number;
      manaCost: number;
      keyword: string;
    }
  | { status: "error"; message: string };

function mapErrorToMessage(error: string): string {
  if (error.includes("not_authenticated")) return "Faça login para fundir.";
  if (error.includes("vessel_not_found_or_used"))
    return "Monstro não encontrado ou já usado em fusão.";
  if (error.includes("strain_not_found_or_used"))
    return "Planta não encontrada ou já usada em fusão.";
  if (error.includes("vessel_catalog_not_found"))
    return "Catálogo do monstro não encontrado. Atualize a página.";
  if (error.includes("strain_catalog_not_found"))
    return "Catálogo da planta não encontrado. Atualize a página.";
  if (error.includes("invalid_strain_family")) return "Strain inválido.";
  return "Falha na fusão. Tente novamente.";
}

export async function fuseCardAction(
  _prevState: FuseState,
  formData: FormData
): Promise<FuseState> {
  const parsed = fuseSchema.safeParse({
    vesselInventoryId: formData.get("vesselInventoryId"),
    userStrainId: formData.get("userStrainId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Selecione 1 vessel e 1 strain." };
  }

  try {
    const { db, userId } = await getDbWithAuth();
    const { vesselInventoryId, userStrainId } = parsed.data;

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${userId}::text))`
      );

      const vesselConsumed = await tx
        .select({ originalId: auditInventoryLedger.originalId })
        .from(auditInventoryLedger)
        .where(
          and(
            eq(auditInventoryLedger.userId, userId),
            eq(auditInventoryLedger.originalId, vesselInventoryId)
          )
        );
      const [vesselRow] = await tx
        .select({
          id: userInventory.id,
          collectibleId: userInventory.collectibleId,
          source: userInventory.source,
          baseHp: collectiblesCatalog.baseHp,
          baseAtk: collectiblesCatalog.baseAtk,
          baseMana: collectiblesCatalog.baseMana,
          imageUrl: collectiblesCatalog.imageUrl,
        })
        .from(userInventory)
        .innerJoin(
          collectiblesCatalog,
          eq(collectiblesCatalog.id, userInventory.collectibleId)
        )
        .where(
          and(
            eq(userInventory.userId, userId),
            eq(userInventory.id, vesselInventoryId)
          )
        );

      if (!vesselRow || vesselConsumed.length > 0)
        throw new Error("vessel_not_found_or_used");

      const strainConsumed = await tx
        .select({ originalId: auditStrainsLedger.originalId })
        .from(auditStrainsLedger)
        .where(
          and(
            eq(auditStrainsLedger.userId, userId),
            eq(auditStrainsLedger.originalId, userStrainId)
          )
        );
      const [strainRow] = await tx
        .select({
          id: userStrains.id,
          strainId: userStrains.strainId,
          source: userStrains.source,
          rarity: strainsCatalog.rarity,
          family: strainsCatalog.family,
        })
        .from(userStrains)
        .innerJoin(
          strainsCatalog,
          eq(strainsCatalog.id, userStrains.strainId)
        )
        .where(
          and(
            eq(userStrains.userId, userId),
            eq(userStrains.id, userStrainId)
          )
        );

      if (!strainRow || strainConsumed.length > 0)
        throw new Error("strain_not_found_or_used");

      if (!strainRow) throw new Error("strain_not_found_or_used");

      const preview = previewFusion(
        {
          baseHp: vesselRow.baseHp,
          baseAtk: vesselRow.baseAtk,
          baseMana: vesselRow.baseMana,
        },
        {
          rarity: strainRow.rarity as "common" | "uncommon" | "rare" | "epic" | "legendary",
          family: strainRow.family as "NEURO" | "SHELL" | "PSYCHO",
        }
      );

      const tokenId = randomBytes(12).toString("hex");

      await tx.insert(auditInventoryLedger).values({
        originalId: vesselRow.id,
        userId,
        collectibleId: vesselRow.collectibleId,
        source: vesselRow.source,
        consumedReason: "fusion",
      });

      await tx.insert(auditStrainsLedger).values({
        originalId: strainRow.id,
        userId,
        strainId: strainRow.strainId,
        source: strainRow.source,
        consumedReason: "fusion",
      });

      const [card] = await tx
        .insert(userCards)
        .values({
          userId,
          tokenId,
          vesselCollectibleId: vesselRow.collectibleId,
          strainId: strainRow.strainId,
          finalHp: preview.finalHp,
          finalAtk: preview.finalAtk,
          manaCost: preview.manaCost,
          keyword: preview.keyword,
          imageUrl: vesselRow.imageUrl,
        })
        .returning({
          id: userCards.id,
          tokenId: userCards.tokenId,
          finalHp: userCards.finalHp,
          finalAtk: userCards.finalAtk,
          manaCost: userCards.manaCost,
          keyword: userCards.keyword,
        });

      if (!card) throw new Error("Insert failed");

      await tx
        .update(redemptionCodes)
        .set({ redeemedInventoryId: null })
        .where(eq(redemptionCodes.redeemedInventoryId, vesselInventoryId));

      await tx
        .delete(userInventory)
        .where(
          and(
            eq(userInventory.userId, userId),
            eq(userInventory.id, vesselInventoryId)
          )
        );

      await tx
        .delete(userStrains)
        .where(
          and(
            eq(userStrains.userId, userId),
            eq(userStrains.id, userStrainId)
          )
        );

      return {
        tokenId: card.tokenId,
        finalHp: card.finalHp,
        finalAtk: card.finalAtk,
        manaCost: card.manaCost,
        keyword: card.keyword,
      };
    });

    revalidatePath("/inventory");
    revalidatePath("/fusion");

    return {
      status: "success",
      tokenId: result.tokenId,
      finalHp: result.finalHp,
      finalAtk: result.finalAtk,
      manaCost: result.manaCost,
      keyword: result.keyword,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (process.env.NODE_ENV === "development") {
      console.error("[fuseCardAction] Error:", msg);
    }
    return {
      status: "error",
      message: mapErrorToMessage(msg),
    };
  }
}
