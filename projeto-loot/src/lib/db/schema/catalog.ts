import {
  uuid,
  text,
  timestamp,
  jsonb,
  pgTable,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { rarityEnum } from "./enums";

export const catalogItemTypeEnum = pgEnum("catalog_item_type", [
  "vessel",
  "strain",
  "weapon",
]);

export const catalog = pgTable(
  "catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: catalogItemTypeEnum("type").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    rarity: rarityEnum("rarity").notNull(),
    imageUrl: text("image_url"),
    attributes: jsonb("attributes").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("catalog_type_slug_idx").on(t.type, t.slug)]
);
