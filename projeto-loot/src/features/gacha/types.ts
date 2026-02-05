export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type StrainFamily = "NEURO" | "SHELL" | "PSYCHO";

export type RedemptionItem = {
  inventoryId: string;
  collectibleId: string;
  collectibleName: string;
  collectibleSlug: string;
  rarity: Rarity;
  imageUrl?: string;
  baseHp?: number;
  baseAtk?: number;
  baseMana?: number;
};

export type StrainDropItem = {
  userStrainId: string;
  strainCatalogId: string;
  name: string;
  slug: string;
  rarity: Rarity;
  family: StrainFamily;
  imageUrl?: string;
};

export type DropResult = {
  vessel: RedemptionItem;
  strain: StrainDropItem;
};

export type RedeemState =
  | { status: "idle" }
  | { status: "success"; drops: DropResult[] }
  | { status: "error"; message: string };
