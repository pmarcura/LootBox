import { SUPABASE_PUBLIC_FALLBACK } from "./public-config";
import { validateSupabaseEnv } from "./env-validation";

/**
 * Returns the anon/publishable key for client-side auth.
 * Uses env vars with public-config fallback so o cliente funciona mesmo sem .env carregado.
 */
function getAnonKey(): string {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return publishable ?? anon ?? SUPABASE_PUBLIC_FALLBACK.anonKey;
}

let _serviceRoleWarningLogged = false;

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_PUBLIC_FALLBACK.url;
  const anonKey = getAnonKey();

  // Validação só falha se nem env nem fallback tiverem URL/chave (não deve acontecer).
  const result = validateSupabaseEnv();
  if (!result.ok && typeof window === "undefined") {
    throw new Error(
      `Configuração Supabase incompleta. Faltando: ${result.missing.join(", ")}`,
    );
  }

  // Avisar só no servidor: no cliente a chave nunca existe (e não deve), então o aviso seria enganoso.
  const isServer = typeof window === "undefined";
  if (
    isServer &&
    process.env.NODE_ENV === "development" &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !_serviceRoleWarningLogged
  ) {
    _serviceRoleWarningLogged = true;
    console.warn(
      "[Supabase] SUPABASE_SERVICE_ROLE_KEY ausente. Rate limit de login e painel admin desabilitados. Adicione ao .env.local para habilitar.",
    );
  }

  return { url, anonKey };
}
