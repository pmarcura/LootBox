"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { eq, and, sql, gt, isNotNull } from "drizzle-orm";

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

/**
 * Converte URL relativa em absoluta quando necessário (evita CORS: usar mesma origem).
 * Preferir VERCEL_URL (deploy atual) para imagens carregadas no cliente.
 * Nunca adiciona barra dupla: base é normalizada sem trailing slash.
 */
function toAbsoluteImageUrl(url: string | null | undefined): string | undefined {
  if (url == null || url === "") return undefined;
  if (url.startsWith("http")) return url;
  const base =
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    undefined;
  if (!base) return url;
  const baseNorm = base.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return baseNorm + path;
}

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

const singleCodeSchema = z
  .string()
  .transform(normalizeCode)
  .refine((value) => value.length === CODE_LENGTH, {
    message: "Comprimento inválido.",
  })
  .refine((value) => isValidCode(value), {
    message: "Código inválido ou checksum incorreto.",
  });

const MAX_CODES_PER_SUBMIT = 5;

/** Extrai até 5 códigos de uma string (linhas, vírgulas ou espaços). */
function parseCodesInput(raw: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\n,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0)
    .slice(0, MAX_CODES_PER_SUBMIT);
}

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
  const rawCodes =
    (formData.get("codes") as string | null) ??
    (formData.get("code") as string | null);
  const codeStrings = parseCodesInput(rawCodes);

  if (codeStrings.length === 0) {
    return { status: "error", message: "Digite ao menos um código (máx. 5)." };
  }

  const codes: string[] = [];
  for (const s of codeStrings) {
    const parsed = singleCodeSchema.safeParse(s);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Código inválido.";
      return { status: "error", message: msg };
    }
    codes.push(parsed.data);
  }

  try {
    const { db, userId } = await getDbWithAuth();
    const headersList = await headers();
    const ipHeader = headersList.get("x-forwarded-for") ?? "";
    const ipHash = ipHeader ? sha256Hex(ipHeader) : null;

    const drops: DropResult[] = [];
    let lastError = "";

    for (const code of codes) {
      const codeHash = sha256Hex(code);
      try {
        const result = await db.transaction(async (tx) => {
          const windowStart = new Date(
            Date.now() - WINDOW_MINUTES * 60 * 1000
          );

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
              imageUrl: collectiblesCatalog.imageUrl,
              baseHp: collectiblesCatalog.baseHp,
              baseAtk: collectiblesCatalog.baseAtk,
              baseMana: collectiblesCatalog.baseMana,
            })
            .from(collectiblesCatalog)
            .where(
              and(
                eq(collectiblesCatalog.rarity, rarity),
                eq(collectiblesCatalog.series, "season01"),
                isNotNull(collectiblesCatalog.imageUrl),
              )
            )
            .orderBy(sql`random()`)
            .limit(1);

          if (!vessel) throw new Error("no_collectible_for_rarity");

          const [strain] = await tx
            .select({
              id: strainsCatalog.id,
              name: strainsCatalog.name,
              slug: strainsCatalog.slug,
              family: strainsCatalog.family,
              imageUrl: strainsCatalog.imageUrl,
            })
            .from(strainsCatalog)
            .where(
              and(
                eq(strainsCatalog.rarity, rarity),
                eq(strainsCatalog.series, "season01"),
                isNotNull(strainsCatalog.imageUrl),
              )
            )
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
              imageUrl: vessel.imageUrl ?? undefined,
              baseHp: vessel.baseHp,
              baseAtk: vessel.baseAtk,
              baseMana: vessel.baseMana,
            },
            strain: {
              userStrainId: ustrain.id,
              strainCatalogId: strain.id,
              name: strain.name,
              slug: strain.slug,
              rarity,
              family: strain.family,
              imageUrl: strain.imageUrl ?? undefined,
            },
          };
        });

        drops.push({
          vessel: {
            inventoryId: result.vessel.inventoryId,
            collectibleId: result.vessel.collectibleId,
            collectibleName: result.vessel.collectibleName,
            collectibleSlug: result.vessel.collectibleSlug,
            rarity: result.vessel.rarity as RedemptionItem["rarity"],
            imageUrl: result.vessel.imageUrl ?? undefined,
            baseHp: result.vessel.baseHp,
            baseAtk: result.vessel.baseAtk,
            baseMana: result.vessel.baseMana,
          },
          strain: {
            userStrainId: result.strain.userStrainId,
            strainCatalogId: result.strain.strainCatalogId,
            name: result.strain.name,
            slug: result.strain.slug,
            rarity: result.strain.rarity as StrainDropItem["rarity"],
            family: result.strain.family as StrainDropItem["family"],
            imageUrl: result.strain.imageUrl ?? undefined,
          },
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : "";
        // Continua com o próximo código; ao final retornamos o que deu certo ou o último erro
      }
    }

    if (drops.length > 0) {
      return { status: "success", drops };
    }
    return {
      status: "error",
      message: mapErrorToMessage(lastError),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return {
      status: "error",
      message: mapErrorToMessage(msg),
    };
  }
}
