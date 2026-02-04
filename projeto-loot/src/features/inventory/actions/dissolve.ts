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

// #region agent log
function dbg(payload: { location: string; message: string; data?: Record<string, unknown>; hypothesisId?: string }) {
  const line = JSON.stringify({ ...payload, timestamp: Date.now(), sessionId: "debug-session" }) + "\n";
  const path = require("path") as typeof import("path");
  const fs = require("fs") as typeof import("fs");
  const cands = [
    path.join(process.cwd(), ".cursor", "debug.log"),
    path.join(process.cwd(), "..", ".cursor", "debug.log"),
    "d:\\Projeto Loot\\.cursor\\debug.log",
  ];
  for (const logPath of cands) {
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, line);
      return;
    } catch {
      continue;
    }
  }
  fetch("http://127.0.0.1:7242/ingest/b2980132-5a33-48b9-a0c6-16efe37f4939", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, timestamp: Date.now(), sessionId: "debug-session" }),
  }).catch(() => {});
}
// #endregion

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
  | { ok: false; message: string; debugMessage?: string };

export async function dissolveAction(
  _prev: unknown,
  formData: FormData
): Promise<DissolveResult> {
  const rawIds = formData.get("ids");
  const parsed = dissolveSchema.safeParse({ ids: rawIds });
  // #region agent log
  dbg({
    location: "dissolve.ts:entry",
    message: "dissolveAction called",
    data: { rawIds: typeof rawIds === "string" ? rawIds.slice(0, 80) : rawIds, parsedOk: parsed.success, firstError: parsed.success ? undefined : parsed.error?.issues?.[0]?.message },
    hypothesisId: "H1",
  });
  // #endregion
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    const { db, userId } = await getDbWithAuth();
    const ids = parsed.data.ids;
    // #region agent log
    dbg({ location: "dissolve.ts:afterAuth", message: "getDbWithAuth ok", data: { userId: userId?.slice(0, 8), idsCount: ids.length }, hypothesisId: "H4" });
    // #endregion

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${userId}::text))`
      );

      const consumedIds = await tx
        .select({ originalId: auditInventoryLedger.originalId })
        .from(auditInventoryLedger)
        .where(eq(auditInventoryLedger.userId, userId));
      const consumedSet = new Set(consumedIds.map((r) => r.originalId));
      // #region agent log
      dbg({ location: "dissolve.ts:afterConsumed", message: "consumedIds query ok", data: { consumedCount: consumedIds.length }, hypothesisId: "H3" });
      // #endregion

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
      // #region agent log
      dbg({ location: "dissolve.ts:afterRows", message: "allRows and filter ok", data: { allRowsCount: allRows.length, rowsCount: rows.length, idsCount: ids.length }, hypothesisId: "H3" });
      // #endregion

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
    const stack = err instanceof Error ? String(err.stack).slice(0, 400) : "";
    // #region agent log
    dbg({
      location: "dissolve.ts:catch",
      message: "dissolveAction error",
      data: { msg, stack, name: err instanceof Error ? err.name : undefined },
      hypothesisId: "H2",
    });
    // #endregion
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
        debugMessage: stack || undefined,
      };
    }
    return {
      ok: false,
      message: "Falha ao dissolver. Tente novamente.",
      debugMessage: msg ? `${msg}${stack ? `\n${stack}` : ""}` : undefined,
    };
  }
}
