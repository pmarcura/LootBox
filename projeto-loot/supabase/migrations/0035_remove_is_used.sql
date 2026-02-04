-- Phase 3 complete: drop is_used columns (hard delete is now used everywhere)
alter table user_inventory drop column if exists is_used;
alter table user_strains drop column if exists is_used;
