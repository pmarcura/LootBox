-- Allow user_cards.vessel_inventory_id to be null for new fusions done via TS (hard delete).
-- TS fuse inserts with vessel_collectible_id only; vessel_inventory_id is omitted.
alter table user_cards alter column vessel_inventory_id drop not null;
