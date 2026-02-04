export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type StrainFamily = "NEURO" | "SHELL" | "PSYCHO";

export type RedemptionItem = {
  inventoryId: string;
  collectibleId: string;
  collectibleName: string;
  collectibleSlug: string;
  rarity: Rarity;
};

export type StrainDropItem = {
  userStrainId: string;
  strainCatalogId: string;
  name: string;
  slug: string;
  rarity: Rarity;
  family: StrainFamily;
};

export type DropResult = {
  vessel: RedemptionItem;
  strain: StrainDropItem;
};

export type RedeemState =
  | { status: "idle" }
  | { status: "success"; drop: DropResult }
  | { status: "error"; message: string };
