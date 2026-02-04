# Contribuindo

## Regras do projeto

- **Supabase:** use **apenas MCP** para migrações e SQL no banco (`apply_migration`, `execute_sql`). Ver [docs/API_E_MCP.md](docs/API_E_MCP.md).
- **Segurança e integridade:** siga as diretrizes em [.cursor/rules/security-data-integrity.mdc](.cursor/rules/security-data-integrity.mdc).
- **Qualidade de código:** siga [.cursor/rules/core-quality.mdc](.cursor/rules/core-quality.mdc).

## Antes de enviar

- `npm run check` (lint + typecheck).
- `npm run test:run` (testes unitários).

## Documentação

- Novas features ou mudanças relevantes: atualize [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) se necessário.
- Novas variáveis de ambiente: documente em `.env.example` e na doc.
- **Margens e barra inferior:** ao criar overlays, painéis ou botões no rodapé da tela, siga [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) (uso de `--content-bottom-safe` e classes `safe-bottom-nav` / `mb-safe-bottom`).
