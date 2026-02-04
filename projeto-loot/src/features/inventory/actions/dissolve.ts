"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, inArray, sql } from "drizzle-orm";

import { getDbWithAuth } from "@/lib/db";
import {
  userInventory,
  profiles,
  redemptionCodes,
  auditInventoryLedger,
  collectiblesCatalog,
} from "@/lib/db/schema";
import { ESSENCE_PER_RARITY } from "@/lib/essence";
import type { Rarity } from "@/lib/db/schema";

const dissolveSchema = z.object({
  ids: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    )
    .refine((arr) => arr.length > 0, { message: "Nenhum item selecionado." })
    .refine(
      (arr) => arr.every((id) => /^[0-9a-f-]{36}$/i.test(id)),
      { message: "IDs inválidos." }
    ),
});

export type DissolveResult =
  | { ok: true; dissolvedCount: number; essenceEarned: number }
  | { ok: false; message: string };

export async function dissolveAction(
  _prev: unknown,
  formData: FormData
): Promise<DissolveResult> {
  const parsed = dissolveSchema.safeParse({
    ids: formData.get("ids"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    const { db, userId } = await getDbWithAuth();
    const ids = parsed.data.ids;

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${userId}::text))`
      );

      const consumedIds = await tx
        .select({ originalId: auditInventoryLedger.originalId })
        .from(auditInventoryLedger)
        .where(eq(auditInventoryLedger.userId, userId));
      const consumedSet = new Set(consumedIds.map((r) => r.originalId));

      const allRows = await tx
        .select({
          id: userInventory.id,
          collectibleId: userInventory.collectibleId,
          source: userInventory.source,
          rarity: collectiblesCatalog.rarity,
        })
        .from(userInventory)
        .innerJoin(
          collectiblesCatalog,
          eq(collectiblesCatalog.id, userInventory.collectibleId)
        )
        .where(
          and(eq(userInventory.userId, userId), inArray(userInventory.id, ids))
        );
      const rows = allRows.filter((r) => !consumedSet.has(r.id));

      if (rows.length === 0) {
        throw new Error("no_valid_cards");
      }
      if (rows.length < ids.length) {
        throw new Error("unauthorized_cards");
      }

      let totalEssence = 0;
      for (const row of rows) {
        const essence =
          ESSENCE_PER_RARITY[(row.rarity as Rarity) ?? "common"] ?? 5;
        totalEssence += essence;

        await tx.insert(auditInventoryLedger).values({
          originalId: row.id,
          userId,
          collectibleId: row.collectibleId,
          source: row.source,
          consumedReason: "dissolved",
        });
      }

      await tx
        .update(redemptionCodes)
        .set({ redeemedInventoryId: null })
        .where(inArray(redemptionCodes.redeemedInventoryId, ids));

      await tx
        .delete(userInventory)
        .where(
          and(
            eq(userInventory.userId, userId),
            inArray(userInventory.id, ids)
          )
        );

      await tx
        .update(profiles)
        .set({
          essenceBalance: sql`${profiles.essenceBalance} + ${totalEssence}`,
        })
        .where(eq(profiles.id, userId));

      return { dissolvedCount: rows.length, essenceEarned: totalEssence };
    });

    revalidatePath("/inventory");
    revalidatePath("/marketplace");

    return {
      ok: true,
      dissolvedCount: result.dissolvedCount,
      essenceEarned: result.essenceEarned,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not_authenticated")) {
      return { ok: false, message: "Faça login para dissolver." };
    }
    if (msg.includes("no_valid_cards")) {
      return { ok: false, message: "Nenhuma carta válida para dissolver." };
    }
    if (msg.includes("unauthorized_cards")) {
      return {
        ok: false,
        message:
          "Você não possui algumas dessas cartas. Recarregue a página e tente novamente.",
      };
    }
    if (process.env.NODE_ENV === "development") {
      return {
        ok: false,
        message: `Erro: ${msg}. Verifique o console do servidor.`,
      };
    }
    return { ok: false, message: "Falha ao dissolver. Tente novamente." };
  }
}
