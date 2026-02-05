"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, sql, gte, isNotNull } from "drizzle-orm";

import { getDbWithAuth } from "@/lib/db";
import {
  userInventory,
  userStrains,
  profiles,
  lootboxTiers,
  clanMembers,
  clans,
  collectiblesCatalog,
  strainsCatalog,
} from "@/lib/db/schema";
import type {
  DropResult,
  RedemptionItem,
  StrainDropItem,
} from "@/features/gacha/types";

const purchaseSchema = z.object({
  tierSlug: z.enum(["bronze", "silver", "gold"]),
});

export type PurchaseState =
  | { status: "idle" }
  | { status: "success"; drop: DropResult }
  | { status: "error"; message: string };

function mapErrorToMessage(error: string): string {
  if (error.includes("insufficient_essence")) {
    return "Essência insuficiente.";
  }
  if (error.includes("tier_not_found")) {
    return "Lootbox não encontrada.";
  }
  if (error.includes("no_collectible_for_rarity")) {
    return "Sem vessels disponíveis. Tente novamente.";
  }
  if (error.includes("no_strain_for_rarity")) {
    return "Sem strains disponíveis. Tente novamente.";
  }
  if (error.includes("not_authenticated")) {
    return "Faça login para comprar.";
  }
  return "Falha na compra. Tente novamente.";
}

export async function purchaseLootboxAction(
  _prevState: PurchaseState,
  formData: FormData
): Promise<PurchaseState> {
  const parsed = purchaseSchema.safeParse({
    tierSlug: formData.get("tierSlug"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Tier inválido.",
    };
  }

  try {
    const { db, userId } = await getDbWithAuth();
    const tierSlug = parsed.data.tierSlug;

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${userId}::text))`
      );

      const [tier] = await tx
        .select()
        .from(lootboxTiers)
        .where(eq(lootboxTiers.slug, tierSlug))
        .for("update");

      if (!tier) throw new Error("tier_not_found");

      const [updated] = await tx
        .update(profiles)
        .set({
          essenceBalance: sql`${profiles.essenceBalance} - ${tier.costEssence}`,
          totalEssenceSpentOnLootbox: sql`${profiles.totalEssenceSpentOnLootbox} + ${tier.costEssence}`,
        })
        .where(
          and(
            eq(profiles.id, userId),
            gte(profiles.essenceBalance, tier.costEssence)
          )
        )
        .returning({ id: profiles.id });

      if (!updated) throw new Error("insufficient_essence");

      const [clanMember] = await tx
        .select({ clanId: clanMembers.clanId })
        .from(clanMembers)
        .where(eq(clanMembers.userId, userId))
        .limit(1);

      if (clanMember) {
        await tx
          .update(clans)
          .set({
            totalEssenceConsumed: sql`${clans.totalEssenceConsumed} + ${tier.costEssence}`,
          })
          .where(eq(clans.id, clanMember.clanId));
      }

      const roll = Math.random();
      const probs = [
        Number(tier.probCommon),
        Number(tier.probCommon) + Number(tier.probUncommon),
        Number(tier.probCommon) +
          Number(tier.probUncommon) +
          Number(tier.probRare),
        Number(tier.probCommon) +
          Number(tier.probUncommon) +
          Number(tier.probRare) +
          Number(tier.probEpic),
      ];
      let rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" =
        "legendary";
      if (roll < probs[0]) rarity = "common";
      else if (roll < probs[1]) rarity = "uncommon";
      else if (roll < probs[2]) rarity = "rare";
      else if (roll < probs[3]) rarity = "epic";

      const [vessel] = await tx
        .select({
          id: collectiblesCatalog.id,
          name: collectiblesCatalog.name,
          slug: collectiblesCatalog.slug,
          imageUrl: collectiblesCatalog.imageUrl,
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

      if (!vessel) {
        await tx
          .update(profiles)
          .set({
            essenceBalance: sql`${profiles.essenceBalance} + ${tier.costEssence}`,
            totalEssenceSpentOnLootbox: sql`${profiles.totalEssenceSpentOnLootbox} - ${tier.costEssence}`,
          })
          .where(eq(profiles.id, userId));
        if (clanMember) {
          await tx
            .update(clans)
            .set({
              totalEssenceConsumed: sql`${clans.totalEssenceConsumed} - ${tier.costEssence}`,
            })
            .where(eq(clans.id, clanMember.clanId));
        }
        throw new Error("no_collectible_for_rarity");
      }

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

      if (!strain) {
        await tx
          .update(profiles)
          .set({
            essenceBalance: sql`${profiles.essenceBalance} + ${tier.costEssence}`,
            totalEssenceSpentOnLootbox: sql`${profiles.totalEssenceSpentOnLootbox} - ${tier.costEssence}`,
          })
          .where(eq(profiles.id, userId));
        if (clanMember) {
          await tx
            .update(clans)
            .set({
              totalEssenceConsumed: sql`${clans.totalEssenceConsumed} - ${tier.costEssence}`,
            })
            .where(eq(clans.id, clanMember.clanId));
        }
        throw new Error("no_strain_for_rarity");
      }

      const [inv] = await tx
        .insert(userInventory)
        .values({
          userId,
          collectibleId: vessel.id,
          source: "lootbox",
        })
        .returning({ id: userInventory.id });

      if (!inv) throw new Error("Insert inventory failed");

      const [ustrain] = await tx
        .insert(userStrains)
        .values({
          userId,
          strainId: strain.id,
          source: "lootbox",
        })
        .returning({ id: userStrains.id });

      if (!ustrain) throw new Error("Insert strain failed");

      return {
        vessel: {
          inventoryId: inv.id,
          collectibleId: vessel.id,
          collectibleName: vessel.name,
          collectibleSlug: vessel.slug,
          rarity,
          imageUrl: vessel.imageUrl ?? undefined,
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

    revalidatePath("/marketplace");
    revalidatePath("/inventory");

    const drop: DropResult = {
      vessel: {
        inventoryId: result.vessel.inventoryId,
        collectibleId: result.vessel.collectibleId,
        collectibleName: result.vessel.collectibleName,
        collectibleSlug: result.vessel.collectibleSlug,
        rarity: result.vessel.rarity as RedemptionItem["rarity"],
        imageUrl: result.vessel.imageUrl,
      },
      strain: {
        userStrainId: result.strain.userStrainId,
        strainCatalogId: result.strain.strainCatalogId,
        name: result.strain.name,
        slug: result.strain.slug,
        rarity: result.strain.rarity as StrainDropItem["rarity"],
        family: result.strain.family as StrainDropItem["family"],
        imageUrl: result.strain.imageUrl,
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
