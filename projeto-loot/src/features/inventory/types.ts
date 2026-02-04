import type { Rarity } from "@/features/gacha/types";

export type InventoryItem = {
  id: string;
  name: string;
  slug: string;
  rarity: Rarity;
  acquiredAt: string;
  /** URL or path to creature image; fallback to placeholder by rarity when null */
  imageUrl?: string | null;
};

/** Grouped by series and collectible; dissolveableIds = ids not consumed (not in audit ledger) */
export type InventoryItemGrouped = {
  collectibleId: string;
  name: string;
  slug: string;
  rarity: Rarity;
  imageUrl?: string | null;
  series: string | null;
  count: number;
  inventoryIds: string[];
  /** Subset of inventoryIds that are not used in fusion (can be dissolved) */
  dissolveableIds: string[];
  acquiredAt: string;
};

export type StrainFamily = "NEURO" | "SHELL" | "PSYCHO";

/** Grouped strain instance for inventory display */
export type StrainItemGrouped = {
  strainCatalogId: string;
  name: string;
  slug: string;
  rarity: Rarity;
  family: StrainFamily;
  imageUrl?: string | null;
  count: number;
  userStrainIds: string[];
  dissolveableIds: string[];
  acquiredAt: string;
};

/** Fused card for inventory display */
export type UserCardItem = {
  id: string;
  tokenId: string;
  finalHp: number;
  finalAtk: number;
  manaCost: number;
  keyword: string;
  vesselName?: string;
  vesselSlug?: string;
  imageUrl?: string | null;
  createdAt: string;
};

/** Row shape from user_inventory select (collectible relation) */
export type CollectibleRow = {
  id: string;
  name: string;
  slug: string;
  rarity: string;
  image_url?: string | null;
  series?: string | null;
};

export type InventoryRow = {
  id: string;
  acquired_at: string;
  collectible: CollectibleRow | CollectibleRow[] | null;
};

export type StrainCatalogRow = {
  id: string;
  name: string;
  slug: string;
  rarity: string;
  family: string;
  image_url?: string | null;
};

export type StrainRow = {
  id: string;
  acquired_at: string;
  strain: StrainCatalogRow | StrainCatalogRow[];
};
