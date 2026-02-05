import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InventoryTabs } from "@/features/inventory/components/InventoryTabs";

export const metadata: Metadata = {
  title: "Inventário",
  description: "Suas criaturas, cartas e essência. Organize a coleção e prepare decks para os duelos.",
};

import type {
  CollectibleRow,
  InventoryItemGrouped,
  InventoryRow,
  StrainCatalogRow,
  StrainItemGrouped,
  StrainRow,
  UserCardItem,
} from "@/features/inventory/types";
import { normalizeCatalogImageUrl } from "@/lib/catalog-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildGroupsBySeries(
  data: InventoryRow[],
  consumedIds: Set<string>,
  usedAsVesselInventoryIds: Set<string>,
): Map<string, InventoryItemGrouped[]> {
  const bySeriesAndCollectible = new Map<
    string,
    { ids: string[]; dissolveableIds: string[]; acquiredAt: string; collectible: CollectibleRow }
  >();

  for (const row of data) {
    const collectible = Array.isArray(row.collectible)
      ? row.collectible[0]
      : row.collectible;
    if (!collectible) continue;

    const seriesKey = collectible.series ?? "sem-serie";
    const collectibleKey = collectible.id;
    const key = `${seriesKey}::${collectibleKey}`;
    const canDissolve =
      !consumedIds.has(row.id) && !usedAsVesselInventoryIds.has(row.id);

    const existing = bySeriesAndCollectible.get(key);
    if (existing) {
      existing.ids.push(row.id);
      if (canDissolve) existing.dissolveableIds.push(row.id);
      if (row.acquired_at > existing.acquiredAt) {
        existing.acquiredAt = row.acquired_at;
      }
    } else {
      bySeriesAndCollectible.set(key, {
        ids: [row.id],
        dissolveableIds: canDissolve ? [row.id] : [],
        acquiredAt: row.acquired_at,
        collectible,
      });
    }
  }

  const groupsBySeries = new Map<string, InventoryItemGrouped[]>();

  for (const [, entry] of bySeriesAndCollectible) {
    const series = entry.collectible.series ?? "sem-serie";
    const seriesLabel = series === "sem-serie" ? "Outros" : series;

    const group: InventoryItemGrouped = {
      collectibleId: entry.collectible.id,
      name: entry.collectible.name,
      slug: entry.collectible.slug,
      rarity: entry.collectible.rarity as InventoryItemGrouped["rarity"],
      imageUrl: normalizeCatalogImageUrl(entry.collectible.image_url) ?? null,
      series: entry.collectible.series ?? null,
      count: entry.ids.length,
      inventoryIds: entry.ids,
      dissolveableIds: entry.dissolveableIds,
      acquiredAt: entry.acquiredAt,
      baseHp: entry.collectible.base_hp,
      baseAtk: entry.collectible.base_atk,
      baseMana: entry.collectible.base_mana,
    };

    const list = groupsBySeries.get(seriesLabel) ?? [];
    list.push(group);
    groupsBySeries.set(seriesLabel, list);
  }

  return groupsBySeries;
}

type CardRow = {
  id: string;
  token_id: string;
  final_hp: number;
  final_atk: number;
  mana_cost: number;
  keyword: string;
  created_at: string;
  vessel_inventory_id?: string | null;
  vessel_collectible_id: string;
  image_url?: string | null;
  strain: { rarity: string } | { rarity: string }[] | null;
};

export default async function InventoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/inventory");
  }

  const [
    inventoryRes,
    strainsRes,
    cardsRes,
    ledgerInvRes,
    ledgerStrainRes,
    season01VesselsRes,
    season01StrainsRes,
    profileRes,
  ] = await Promise.all([
    supabase
      .from("user_inventory")
      .select(
        "id, acquired_at, collectible:collectibles_catalog(id, name, slug, rarity, image_url, series, base_hp, base_atk, base_mana)",
      )
      .eq("user_id", user.id)
      .order("acquired_at", { ascending: false }),
    supabase
      .from("user_strains")
      .select(
        "id, acquired_at, strain:strains_catalog(id, name, slug, rarity, family, image_url, series)",
      )
      .eq("user_id", user.id)
      .order("acquired_at", { ascending: false }),
    supabase
      .from("user_cards")
      .select("id, token_id, final_hp, final_atk, mana_cost, keyword, created_at, vessel_inventory_id, vessel_collectible_id, image_url, strain:strains_catalog(rarity)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_inventory_ledger")
      .select("original_id")
      .eq("user_id", user.id),
    supabase
      .from("audit_strains_ledger")
      .select("original_id")
      .eq("user_id", user.id),
    supabase
      .from("collectibles_catalog")
      .select("id", { count: "exact", head: true })
      .eq("series", "season01"),
    supabase
      .from("strains_catalog")
      .select("id", { count: "exact", head: true })
      .eq("series", "season01"),
    supabase.from("profiles").select("season01_purge_claimed_at").eq("id", user.id).single(),
  ]);

  const consumedInventoryIds = new Set(
    (ledgerInvRes.data ?? []).map(
      (r: { original_id: string }) => r.original_id,
    ),
  );
  const consumedStrainIds = new Set(
    (ledgerStrainRes.data ?? []).map(
      (r: { original_id: string }) => r.original_id,
    ),
  );

  const rows = (inventoryRes.data ?? []) as InventoryRow[];
  const cardsData = (cardsRes.data ?? []) as CardRow[];
  const usedAsVesselInventoryIds = new Set(
    cardsData
      .map((c) => c.vessel_inventory_id)
      .filter((id): id is string => Boolean(id)),
  );
  const rowsForVessels = rows.filter((r) => !usedAsVesselInventoryIds.has(r.id));
  const groupsBySeries = buildGroupsBySeries(
    rowsForVessels,
    consumedInventoryIds,
    usedAsVesselInventoryIds,
  );

  const strainRows = (strainsRes.data ?? []) as StrainRow[];
  const strainGroups = buildStrainGroups(strainRows, consumedStrainIds);

  const vesselCollectibleIds = cardsData
    .map((c) => c.vessel_collectible_id)
    .filter(Boolean);
  const vesselCollectibleIdSet = new Set(vesselCollectibleIds);
  const vesselCatalogByCollectibleId: Record<
    string,
    { name: string; slug: string; image_url?: string | null }
  > = {};
  if (vesselCollectibleIdSet.size > 0) {
    const { data: catalogRows } = await supabase
      .from("collectibles_catalog")
      .select("id, name, slug, image_url")
      .in("id", Array.from(vesselCollectibleIdSet));
    for (const r of catalogRows ?? []) {
      vesselCatalogByCollectibleId[r.id] = {
        name: r.name,
        slug: r.slug,
        image_url: r.image_url ?? null,
      };
    }
  }

  const userCards: UserCardItem[] = cardsData.map((c) => {
    const strain = Array.isArray(c.strain) ? c.strain[0] : c.strain;
    const strainRarity = strain?.rarity as UserCardItem["strainRarity"] | undefined;
    const catalog = vesselCatalogByCollectibleId[c.vessel_collectible_id];
    return {
      id: c.id,
      tokenId: c.token_id,
      finalHp: c.final_hp,
      finalAtk: c.final_atk,
      manaCost: c.mana_cost,
      keyword: c.keyword,
      vesselName: catalog?.name,
      vesselSlug: catalog?.slug,
      createdAt: c.created_at,
      imageUrl:
        normalizeCatalogImageUrl(c.image_url) ??
        normalizeCatalogImageUrl(catalog?.image_url) ??
        null,
      strainRarity: strainRarity ?? null,
    };
  });

  const totalVessels = rowsForVessels.length;
  const totalStrains = strainRows.length;
  const totalCards = userCards.length;
  const hasAny = totalVessels > 0 || totalStrains > 0 || totalCards > 0;

  const totalSeason01Vessels = season01VesselsRes.count ?? 0;
  const totalSeason01Strains = season01StrainsRes.count ?? 0;
  const season01Total = totalSeason01Vessels + totalSeason01Strains;
  const userSeason01Vessels = (groupsBySeries.get("season01") ?? []).length;
  const userSeason01Strains = new Set(
    strainRows
      .map((r) => {
        const strain = Array.isArray(r.strain) ? r.strain[0] : r.strain;
        return strain?.series === "season01" ? strain.id : null;
      })
      .filter((id): id is string => id != null),
  ).size;
  const season01Owned = userSeason01Vessels + userSeason01Strains;
  const season01PurgeClaimedAt = (profileRes.data as { season01_purge_claimed_at?: string | null } | null)?.season01_purge_claimed_at ?? null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8 dark:from-zinc-950 dark:to-black sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            Inventário
          </span>
        </nav>

        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Coleção Biopunk
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {hasAny
              ? `Vessels, strains e cartas fundidas. Dissolva itens não usados para ganhar essência.`
              : "Resgate códigos ou compre lootboxes para obter vessels e strains."}
          </p>
        </header>

        {!hasAny ? (
          <div className="rounded-xl border-2 border-[var(--biopunk-metal-light)] biopunk-panel-metal p-12 text-center dark:bg-zinc-950">
            <p className="mb-6 text-zinc-500 dark:text-zinc-400">
              Você ainda não possui nenhum item.
            </p>
            <Link
              href="/gacha"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Resgatar um código
            </Link>
          </div>
        ) : (
          <>
            <InventoryTabs
              groupsBySeries={groupsBySeries}
              strainGroups={strainGroups}
              userCards={userCards}
              totalVessels={totalVessels}
              totalStrains={totalStrains}
              totalCards={totalCards}
              season01Total={season01Total}
              season01Owned={season01Owned}
              season01PurgeClaimedAt={season01PurgeClaimedAt}
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/fusion"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/50"
              >
                Fusão
              </Link>
              <Link
                href="/gacha"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                Resgatar códigos
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/50"
              >
                Marketplace
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function buildStrainGroups(
  data: StrainRow[],
  consumedIds: Set<string>,
): Map<string, StrainItemGrouped[]> {
  const byStrain = new Map<
    string,
    { ids: string[]; dissolveableIds: string[]; acquiredAt: string; strain: StrainCatalogRow }
  >();

  for (const row of data) {
    const strain = Array.isArray(row.strain) ? row.strain[0] : row.strain;
    if (!strain) continue;
    const key = strain.id;
    const canDissolve = !consumedIds.has(row.id);

    const existing = byStrain.get(key);
    if (existing) {
      existing.ids.push(row.id);
      if (canDissolve) existing.dissolveableIds.push(row.id);
      if (row.acquired_at > existing.acquiredAt) existing.acquiredAt = row.acquired_at;
    } else {
      byStrain.set(key, {
        ids: [row.id],
        dissolveableIds: canDissolve ? [row.id] : [],
        acquiredAt: row.acquired_at,
        strain,
      });
    }
  }

  const byFamily = new Map<string, StrainItemGrouped[]>();
  for (const [, entry] of byStrain) {
    const group: StrainItemGrouped = {
      strainCatalogId: entry.strain.id,
      name: entry.strain.name,
      slug: entry.strain.slug,
      rarity: entry.strain.rarity as StrainItemGrouped["rarity"],
      family: entry.strain.family as StrainItemGrouped["family"],
      imageUrl: normalizeCatalogImageUrl(entry.strain.image_url) ?? null,
      count: entry.ids.length,
      userStrainIds: entry.ids,
      dissolveableIds: entry.dissolveableIds,
      acquiredAt: entry.acquiredAt,
    };
    const list = byFamily.get(entry.strain.family) ?? [];
    list.push(group);
    byFamily.set(entry.strain.family, list);
  }
  return byFamily;
}
