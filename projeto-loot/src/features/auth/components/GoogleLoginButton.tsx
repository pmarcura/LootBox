"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type GoogleLoginButtonProps = {
  redirectTo?: string;
};

export function GoogleLoginButton({ redirectTo = "/gacha" }: GoogleLoginButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      // Callback deve ser sempre a origem do APP (onde está o /auth/callback), nunca a URL do Supabase.
      let baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      if (typeof baseUrl === "string" && baseUrl.includes("supabase.co")) {
        baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      }
      baseUrl = (baseUrl || "http://localhost:3000").replace(/\/$/, "");
      const callbackUrl = `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });
      if (err) {
        setError(err.message === "Email not confirmed" ? "Confirme seu email no Google." : err.message);
        setLoading(false);
        return;
      }
      // Redirecionamento é feito pelo Supabase para o Google e depois para callbackUrl
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[GoogleLogin]", e);
      setError(
        message.includes("NEXT_PUBLIC_")
          ? "Variáveis do Supabase não carregaram no navegador. Coloque NEXT_PUBLIC_SUPABASE_URL e a chave pública no .env.local (pasta projeto-loot) e rode npm run dev a partir dessa pasta."
          : `Não foi possível iniciar o login com Google. ${message}`,
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2"
      >
        {loading ? (
          "Abrindo Google..."
        ) : (
          <>
            <GoogleIcon className="h-5 w-5" />
            Entrar com Google
          </>
        )}
      </Button>
      {error && (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
