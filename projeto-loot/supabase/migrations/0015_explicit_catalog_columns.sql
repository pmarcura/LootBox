-- Reformulação completa: remover metadata jsonb genérico e adicionar colunas explícitas
-- relevantes para o catálogo (vessels e strains).

-- 1. collectibles_catalog (vessels): role, lore, tech, flavor_text
alter table collectibles_catalog
  add column if not exists role text,
  add column if not exists lore text,
  add column if not exists tech text,
  add column if not exists flavor_text text;

comment on column collectibles_catalog.role is 'Função/arquétipo do vessel (ex: Scavenger, Guardian)';
comment on column collectibles_catalog.lore is 'Descrição narrativa do monstro';
comment on column collectibles_catalog.tech is 'Tecnologia/sistema característico';
comment on column collectibles_catalog.flavor_text is 'Citação especial (ex: lendários)';

-- Migrar dados existentes de metadata para novas colunas (se houver)
update collectibles_catalog
set
  role = (metadata->>'role')::text,
  tech = (metadata->>'tech')::text,
  lore = coalesce((metadata->>'lore')::text, (metadata->>'planet')::text)
where metadata is not null and metadata != '{}'::jsonb;

-- Remover coluna metadata
alter table collectibles_catalog drop column if exists metadata;

-- 2. strains_catalog: description, penalty
alter table strains_catalog
  add column if not exists description text,
  add column if not exists penalty text;

comment on column strains_catalog.description is 'Descrição do strain como software/vírus que hackeia o cérebro';
comment on column strains_catalog.penalty is 'Penalidade/efeito por família (ex: -50%, +2 Mana)';

-- Migrar dados existentes de metadata para novas colunas (se houver)
update strains_catalog
set
  description = (metadata->>'description')::text,
  penalty = (metadata->>'penalty')::text
where metadata is not null and metadata != '{}'::jsonb;

-- Remover coluna metadata
alter table strains_catalog drop column if exists metadata;
