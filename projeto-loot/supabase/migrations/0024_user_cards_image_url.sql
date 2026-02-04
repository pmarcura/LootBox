-- Add image_url to user_cards (art from vessel collectible); backfill and update fuse_card

alter table user_cards
  add column if not exists image_url text;

comment on column user_cards.image_url is 'URL or path to card art (from collectibles_catalog at fuse time)';

-- Backfill existing cards from vessel collectible
update user_cards uc
set image_url = coalesce(
  (select c.image_url from user_inventory ui join collectibles_catalog c on c.id = ui.collectible_id where ui.id = uc.vessel_inventory_id),
  uc.image_url
)
where uc.image_url is null;
