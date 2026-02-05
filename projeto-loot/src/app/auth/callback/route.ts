import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Redireciona via HTML + JS em vez de 302. No Safari (iOS), Set-Cookie em resposta 302
 * pode não ser persistido; com 200 + client redirect os cookies são aceitos antes da navegação.
 */
function redirectHtml(targetUrl: string): string {
  const escaped = targetUrl
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Entrando...</title><script>window.location.replace("${escaped}");</script></head><body><p>Redirecionando...</p></body></html>`;
}

/**
 * Callback do OAuth (Google etc.). Troca o code por sessão e redireciona para a página desejada.
 * Usa resposta 200 + redirect no cliente para Safari mobile aceitar os cookies da sessão.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/gacha";
  const origin = new URL(request.url).origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const redirectToPath = next.startsWith("/") ? next : `/${next}`;
      let targetPath = redirectToPath;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        targetPath =
          profile?.is_admin && (next === "/gacha" || next === "/" || !next) ? "/admin" : redirectToPath;
      }
      const targetUrl = `${origin}${targetPath}`;
      return new NextResponse(redirectHtml(targetUrl), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
