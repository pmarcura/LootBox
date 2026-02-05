import {
  uuid,
  text,
  boolean,
  timestamp,
  bigint,
  integer,
  numeric,
  pgTable,
  primaryKey,
} from "drizzle-orm/pg-core";
import { rarityEnum, strainFamilyEnum } from "./enums";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  essenceBalance: bigint("essence_balance", { mode: "number" }).notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  experience: integer("experience").notNull().default(0),
  totalEssenceSpentOnLootbox: bigint("total_essence_spent_on_lootbox", {
    mode: "number",
  })
    .notNull()
    .default(0),
  starterPackGrantedAt: timestamp("starter_pack_granted_at", {
    withTimezone: true,
  }),
  season01PurgeClaimedAt: timestamp("season01_purge_claimed_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collectiblesCatalog = pgTable("collectibles_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  rarity: rarityEnum("rarity").notNull(),
  series: text("series"),
  modelKey: text("model_key"),
  imageUrl: text("image_url"),
  baseHp: integer("base_hp").notNull().default(0),
  baseAtk: integer("base_atk").notNull().default(0),
  baseMana: integer("base_mana").notNull().default(0),
  role: text("role"),
  lore: text("lore"),
  tech: text("tech"),
  flavorText: text("flavor_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const strainsCatalog = pgTable("strains_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  rarity: rarityEnum("rarity").notNull(),
  family: strainFamilyEnum("family").notNull(),
  series: text("series"),
  imageUrl: text("image_url"),
  description: text("description"),
  penalty: text("penalty"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userInventory = pgTable("user_inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  collectibleId: uuid("collectible_id")
    .notNull()
    .references(() => collectiblesCatalog.id),
  acquiredAt: timestamp("acquired_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  source: text("source").notNull().default("redemption"),
  redemptionCodeHash: text("redemption_code_hash"),
});

export const userStrains = pgTable("user_strains", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  strainId: uuid("strain_id")
    .notNull()
    .references(() => strainsCatalog.id),
  acquiredAt: timestamp("acquired_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  source: text("source").notNull().default("redemption"),
});

export const userCards = pgTable("user_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tokenId: text("token_id").notNull().unique(),
  vesselInventoryId: uuid("vessel_inventory_id").references(() => userInventory.id),
  vesselCollectibleId: uuid("vessel_collectible_id")
    .notNull()
    .references(() => collectiblesCatalog.id),
  strainId: uuid("strain_id")
    .notNull()
    .references(() => strainsCatalog.id),
  finalHp: integer("final_hp").notNull(),
  finalAtk: integer("final_atk").notNull(),
  manaCost: integer("mana_cost").notNull(),
  keyword: text("keyword").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const redemptionCodes = pgTable("redemption_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  codeHash: text("code_hash").notNull(),
  batchId: text("batch_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  redeemedBy: uuid("redeemed_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  redeemedInventoryId: uuid("redeemed_inventory_id").references(
    () => userInventory.id,
    { onDelete: "set null" }
  ),
});

export const redemptionAttempts = pgTable("redemption_attempts", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id"),
  ipHash: text("ip_hash"),
  codeHash: text("code_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  success: boolean("success").notNull().default(false),
});

export const auditInventoryLedger = pgTable("audit_inventory_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalId: uuid("original_id").notNull(),
  userId: uuid("user_id").notNull(),
  collectibleId: uuid("collectible_id").notNull(),
  source: text("source").notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  consumedReason: text("consumed_reason")
    .notNull()
    .$type<"fusion" | "dissolved">(),
});

export const auditStrainsLedger = pgTable("audit_strains_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalId: uuid("original_id").notNull(),
  userId: uuid("user_id").notNull(),
  strainId: uuid("strain_id").notNull(),
  source: text("source").notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  consumedReason: text("consumed_reason")
    .notNull()
    .$type<"fusion" | "dissolved">(),
});

export const clans = pgTable("clans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  totalEssenceConsumed: bigint("total_essence_consumed", { mode: "number" })
    .notNull()
    .default(0),
});

export const clanMembers = pgTable(
  "clan_members",
  {
    clanId: uuid("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.clanId, t.userId] })]
);

export const lootboxTiers = pgTable("lootbox_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  costEssence: integer("cost_essence").notNull(),
  probCommon: numeric("prob_common", { precision: 5, scale: 4 }).notNull(),
  probUncommon: numeric("prob_uncommon", { precision: 5, scale: 4 }).notNull(),
  probRare: numeric("prob_rare", { precision: 5, scale: 4 }).notNull(),
  probEpic: numeric("prob_epic", { precision: 5, scale: 4 }).notNull(),
  probLegendary: numeric("prob_legendary", { precision: 5, scale: 4 }).notNull(),
});
