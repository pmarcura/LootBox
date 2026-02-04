"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, inArray, sql } from "drizzle-orm";

import { getDbWithAuth } from "@/lib/db";
import {
  userStrains,
  profiles,
  auditStrainsLedger,
  strainsCatalog,
} from "@/lib/db/schema";
import { ESSENCE_PER_RARITY } from "@/lib/essence";
import type { Rarity } from "@/lib/db/schema";

const dissolveStrainsSchema = z.object({
  ids: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    )
    .refine((arr) => arr.length > 0, {
      message: "Nenhum strain selecionado.",
    })
    .refine(
      (arr) => arr.every((id) => /^[0-9a-f-]{36}$/i.test(id)),
      { message: "IDs inválidos." }
    ),
});

export type DissolveStrainsResult =
  | { ok: true; dissolvedCount: number; essenceEarned: number }
  | { ok: false; message: string };

export async function dissolveStrainsAction(
  _prev: unknown,
  formData: FormData
): Promise<DissolveStrainsResult> {
  const parsed = dissolveStrainsSchema.safeParse({
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

      const rows = await tx
        .select({
          id: userStrains.id,
          strainId: userStrains.strainId,
          source: userStrains.source,
          rarity: strainsCatalog.rarity,
        })
        .from(userStrains)
        .innerJoin(
          strainsCatalog,
          eq(strainsCatalog.id, userStrains.strainId)
        )
        .where(
          and(
            eq(userStrains.userId, userId),
            eq(userStrains.isUsed, false),
            inArray(userStrains.id, ids)
          )
        );

      if (rows.length === 0) {
        throw new Error("no_valid_strains");
      }
      if (rows.length < ids.length) {
        throw new Error("unauthorized_strains");
      }

      let totalEssence = 0;
      for (const row of rows) {
        const essence =
          ESSENCE_PER_RARITY[(row.rarity as Rarity) ?? "common"] ?? 5;
        totalEssence += essence;

        await tx.insert(auditStrainsLedger).values({
          originalId: row.id,
          userId,
          strainId: row.strainId,
          source: row.source,
          consumedReason: "dissolved",
        });
      }

      await tx
        .delete(userStrains)
        .where(
          and(eq(userStrains.userId, userId), inArray(userStrains.id, ids))
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
    if (msg.includes("no_valid_strains")) {
      return {
        ok: false,
        message:
          "Nenhum strain válido para dissolver (ou já usado em fusão).",
      };
    }
    if (msg.includes("unauthorized_strains")) {
      return {
        ok: false,
        message:
          "Você não possui alguns desses strains. Recarregue a página e tente novamente.",
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
