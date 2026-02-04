/**
 * Fallbacks para config pública do Supabase (só URL e chave anon).
 * Usado quando .env.local não é carregado (ex.: dev rodado fora de projeto-loot).
 * .env.local continua tendo prioridade quando disponível.
 */
export const SUPABASE_PUBLIC_FALLBACK = {
  url: "https://feryjnnjmvbazasniaos.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcnlqbm5qbXZiYXphc25pYW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzA3OTEsImV4cCI6MjA4NTUwNjc5MX0.o9CWawZpVZ85NfJz9mzK4pi_dCLC-wFXEb35yPTVvig",
} as const;
