/**
 * Validates Supabase environment variables.
 * Use for fail-fast in scripts and optional warnings in Next.js app.
 */

export type ValidateResult = {
  ok: boolean;
  missing: string[];
  url?: string;
};

/** Check anon/publishable key (either one suffices) */
function hasAnonKey(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Validates env for the Next.js app (URL + anon key).
 * Service role is optional; if missing, admin/rate-limit features are limited.
 */
export function validateSupabaseEnv(): ValidateResult {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const missing: string[] = [];

  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!hasAnonKey()) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return {
    ok: missing.length === 0,
    missing,
    url: url || undefined,
  };
}

/**
 * Validates env for Drizzle (Server Actions that use getDbWithAuth).
 * DATABASE_URL = Supabase Postgres connection string (Settings > Database > Connection string, use pooler).
 */
export function validateDatabaseEnv(): ValidateResult {
  const url = process.env.DATABASE_URL;
  const missing: string[] = [];
  if (!url) missing.push("DATABASE_URL");
  return {
    ok: missing.length === 0,
    missing,
    url: url || undefined,
  };
}

/**
 * Validates env for admin scripts (seed, import, bootstrap).
 * Requires URL + Service Role Key. Fails with clear instructions if missing.
 */
export function validateSupabaseAdminEnv(): ValidateResult {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing: string[] = [];

  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRole) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return {
    ok: missing.length === 0,
    missing,
    url: url || undefined,
  };
}

const ADMIN_ENV_INSTRUCTIONS = `
Configuração necessária:

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto (ou crie um)
3. Vá em Settings > API
4. Copie:
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - service_role (secret) → SUPABASE_SERVICE_ROLE_KEY
5. Crie ou edite .env.local na raiz do projeto com:

   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

Variáveis faltando:`;

/**
 * Throws with clear instructions if admin env is invalid.
 * Call this at the start of scripts that need admin client.
 */
export function requireSupabaseAdminEnv(): void {
  const result = validateSupabaseAdminEnv();
  if (!result.ok) {
    throw new Error(
      `${ADMIN_ENV_INSTRUCTIONS} ${result.missing.join(", ")}`,
    );
  }
}
