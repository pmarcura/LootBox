-- Remover colunas não utilizadas: role e tech
-- Mantemos apenas lore e flavor_text para vessels

alter table collectibles_catalog drop column if exists role;
alter table collectibles_catalog drop column if exists tech;
