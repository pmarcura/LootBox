import type { NextConfig } from "next";

// Fallbacks para quando o dev é rodado fora de projeto-loot e .env.local não é carregado.
// .env.local continua tendo prioridade quando carregado.
const nextConfig: NextConfig = {
  compress: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "feryjnnjmvbazasniaos.supabase.co", pathname: "/**" },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://feryjnnjmvbazasniaos.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "sb_publishable_RinFUqZ1VtdMuQJxjcMjcw_iuDtbXv3",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcnlqbm5qbXZiYXphc25pYW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzA3OTEsImV4cCI6MjA4NTUwNjc5MX0.o9CWawZpVZ85NfJz9mzK4pi_dCLC-wFXEb35yPTVvig",
  },
};

export default nextConfig;
