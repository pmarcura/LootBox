-- Add image_url to collectibles_catalog for creature artwork/placeholders
alter table collectibles_catalog
  add column if not exists image_url text;

comment on column collectibles_catalog.image_url is 'URL or path to creature image (e.g. /images/creatures/slug.png)';
