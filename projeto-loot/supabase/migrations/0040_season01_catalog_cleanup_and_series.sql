-- Season01: organizar catálogos, backfill imagens das cartas fundidas, remover itens sem imagem (apenas os não referenciados)

-- 1. Adicionar coluna series em strains_catalog (igual ao collectibles_catalog)
alter table strains_catalog
  add column if not exists series text;

comment on column strains_catalog.series is 'Temporada/série do strain (ex: season01)';

-- 2. Garantir que todos os collectibles tenham series = season01
update collectibles_catalog
set series = 'season01'
where series is distinct from 'season01';

-- 3. Definir series = season01 para todas as strains
update strains_catalog
set series = 'season01';

-- 4. Backfill: cartas fundidas recebem image_url do vessel (collectibles_catalog)
update user_cards uc
set image_url = c.image_url
from collectibles_catalog c
where uc.vessel_collectible_id = c.id
  and (uc.image_url is null or trim(uc.image_url) = '')
  and c.image_url is not null
  and trim(c.image_url) <> '';

-- 5. Remover strains sem imagem que não são referenciadas em user_strains nem user_cards
delete from strains_catalog s
where (s.image_url is null or trim(s.image_url) = '')
  and not exists (select 1 from user_strains us where us.strain_id = s.id)
  and not exists (select 1 from user_cards uc where uc.strain_id = s.id);

-- 6. Remover vessels (collectibles) sem imagem que não são referenciados
delete from collectibles_catalog c
where (c.image_url is null or trim(c.image_url) = '')
  and not exists (select 1 from user_inventory ui where ui.collectible_id = c.id)
  and not exists (select 1 from user_cards uc where uc.vessel_collectible_id = c.id);
