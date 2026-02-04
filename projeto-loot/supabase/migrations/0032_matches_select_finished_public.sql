-- Permitir que qualquer usuário autenticado leia partidas finalizadas (para exibir histórico no perfil de outros jogadores, estilo LoL).
-- Mantém a política existente: cada um continua vendo apenas as próprias partidas em andamento.

create policy matches_select_finished_public
  on matches for select
  to authenticated
  using (status = 'finished');
