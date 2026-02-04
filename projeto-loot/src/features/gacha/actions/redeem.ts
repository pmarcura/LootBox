"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { eq, and, sql, gt } from "drizzle-orm";

import { getDbWithAuth } from "@/lib/db";
import {
  userInventory,
  userStrains,
  redemptionCodes,
  redemptionAttempts,
  collectiblesCatalog,
  strainsCatalog,
} from "@/lib/db/schema";
import { CODE_LENGTH, normalizeCode } from "../constants";
import { isValidCode } from "../checksum";
import type {
  DropResult,
  RedeemState,
  RedemptionItem,
  StrainDropItem,
} from "../types";

const GACHA_PROBS = {
  common: 0.6,
  uncommon: 0.25,
  rare: 0.1,
  epic: 0.04,
  legendary: 0.01,
} as const;

type RarityKey = keyof typeof GACHA_PROBS;

function rollRarity(): RarityKey {
  const r = Math.random();
  if (r < GACHA_PROBS.common) return "common";
  if (r < GACHA_PROBS.common + GACHA_PROBS.uncommon) return "uncommon";
  if (r < GACHA_PROBS.common + GACHA_PROBS.uncommon + GACHA_PROBS.rare)
    return "rare";
  if (
    r <
    GACHA_PROBS.common +
      GACHA_PROBS.uncommon +
      GACHA_PROBS.rare +
      GACHA_PROBS.epic
  )
    return "epic";
  return "legendary";
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

const redeemSchema = z.object({
  code: z
    .string()
    .transform(normalizeCode)
    .refine((value) => value.length === CODE_LENGTH, {
      message: "Comprimento inválido.",
    })
    .refine((value) => isValidCode(value), {
      message: "Código inválido ou checksum incorreto.",
    }),
});

function mapErrorToMessage(error: string): string {
  if (error.includes("rate_limited")) {
    return "Muitas tentativas. Aguarde alguns minutos.";
  }
  if (error.includes("invalid_code_format")) {
    return "Código inválido. Verifique caracteres e formato.";
  }
  if (error.includes("code_not_found")) {
    return "Código não encontrado.";
  }
  if (error.includes("code_already_redeemed")) {
    return "Este código já foi resgatado.";
  }
  if (error.includes("code_inactive")) {
    return "Este código está inativo.";
  }
  if (error.includes("no_collectible_for_rarity")) {
    return "Sem vessels disponíveis para essa raridade.";
  }
  if (error.includes("no_strain_for_rarity")) {
    return "Sem strains disponíveis para essa raridade.";
  }
  if (error.includes("not_authenticated")) {
    return "Faça login para resgatar.";
  }
  return "Falha no resgate. Tente novamente.";
}

const USER_LIMIT = 5;
const IP_LIMIT = 20;
const WINDOW_MINUTES = 5;

export async function redeemAction(
  _prevState: RedeemState,
  formData: FormData
): Promise<RedeemState> {
  const parsed = redeemSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Código inválido.";
    return { status: "error", message: firstError };
  }

  try {
    const { db, userId } = await getDbWithAuth();
    const code = parsed.data.code;
    const codeHash = sha256Hex(code);

    const headersList = await headers();
    const ipHeader = headersList.get("x-forwarded-for") ?? "";
    const ipHash = ipHeader ? sha256Hex(ipHeader) : null;

    const result = await db.transaction(async (tx) => {
      const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

      const [userAttempts] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(redemptionAttempts)
        .where(
          and(
            eq(redemptionAttempts.userId, userId),
            gt(redemptionAttempts.createdAt, windowStart)
          )
        );

      if ((userAttempts?.count ?? 0) >= USER_LIMIT) {
        throw new Error("rate_limited");
      }

      if (ipHash) {
        const [ipAttempts] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(redemptionAttempts)
          .where(
            and(
              eq(redemptionAttempts.ipHash, ipHash),
              gt(redemptionAttempts.createdAt, windowStart)
            )
          );
        if ((ipAttempts?.count ?? 0) >= IP_LIMIT) {
          throw new Error("rate_limited");
        }
      }

      const [attempt] = await tx
        .insert(redemptionAttempts)
        .values({
          userId,
          ipHash,
          codeHash,
          success: false,
        })
        .returning({ id: redemptionAttempts.id });

      if (!attempt) throw new Error("Insert attempt failed");

      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${codeHash}::text))`
      );

      const [codeRow] = await tx
        .select()
        .from(redemptionCodes)
        .where(eq(redemptionCodes.codeHash, codeHash))
        .for("update");

      if (!codeRow) throw new Error("code_not_found");
      if (!codeRow.isActive) throw new Error("code_inactive");
      if (codeRow.redeemedAt) throw new Error("code_already_redeemed");

      const rarity = rollRarity();

      const [vessel] = await tx
        .select({
          id: collectiblesCatalog.id,
          name: collectiblesCatalog.name,
          slug: collectiblesCatalog.slug,
        })
        .from(collectiblesCatalog)
        .where(eq(collectiblesCatalog.rarity, rarity))
        .orderBy(sql`random()`)
        .limit(1);

      if (!vessel) throw new Error("no_collectible_for_rarity");

      const [strain] = await tx
        .select({
          id: strainsCatalog.id,
          name: strainsCatalog.name,
          slug: strainsCatalog.slug,
          family: strainsCatalog.family,
        })
        .from(strainsCatalog)
        .where(eq(strainsCatalog.rarity, rarity))
        .orderBy(sql`random()`)
        .limit(1);

      if (!strain) throw new Error("no_strain_for_rarity");

      const now = new Date();

      const [inv] = await tx
        .insert(userInventory)
        .values({
          userId,
          collectibleId: vessel.id,
          source: "redemption",
          redemptionCodeHash: codeHash,
        })
        .returning({ id: userInventory.id });

      if (!inv) throw new Error("Insert inventory failed");

      const [ustrain] = await tx
        .insert(userStrains)
        .values({
          userId,
          strainId: strain.id,
          source: "redemption",
        })
        .returning({ id: userStrains.id });

      if (!ustrain) throw new Error("Insert strain failed");

      await tx
        .update(redemptionCodes)
        .set({
          redeemedAt: now,
          redeemedBy: userId,
          redeemedInventoryId: inv.id,
          isActive: false,
        })
        .where(eq(redemptionCodes.id, codeRow.id));

      await tx
        .update(redemptionAttempts)
        .set({ success: true })
        .where(eq(redemptionAttempts.id, attempt.id));

      return {
        vessel: {
          inventoryId: inv.id,
          collectibleId: vessel.id,
          collectibleName: vessel.name,
          collectibleSlug: vessel.slug,
          rarity,
        },
        strain: {
          userStrainId: ustrain.id,
          strainCatalogId: strain.id,
          name: strain.name,
          slug: strain.slug,
          rarity,
          family: strain.family,
        },
      };
    });

    const drop: DropResult = {
      vessel: {
        inventoryId: result.vessel.inventoryId,
        collectibleId: result.vessel.collectibleId,
        collectibleName: result.vessel.collectibleName,
        collectibleSlug: result.vessel.collectibleSlug,
        rarity: result.vessel.rarity as RedemptionItem["rarity"],
      },
      strain: {
        userStrainId: result.strain.userStrainId,
        strainCatalogId: result.strain.strainCatalogId,
        name: result.strain.name,
        slug: result.strain.slug,
        rarity: result.strain.rarity as StrainDropItem["rarity"],
        family: result.strain.family as StrainDropItem["family"],
      },
    };

    return { status: "success", drop };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return {
      status: "error",
      message: mapErrorToMessage(msg),
    };
  }
}
