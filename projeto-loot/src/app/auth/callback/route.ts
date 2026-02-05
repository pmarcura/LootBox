import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Callback do OAuth (Google etc.). Troca o code por sessão e redireciona para a página desejada.
 * Importante: o redirect SEMPRE usa a origem da requisição (request.url.origin), nunca
 * NEXT_PUBLIC_SITE_URL. Assim os cookies da sessão ficam no mesmo domínio em que o usuário
 * está (evita loop: callback em genesis-gilt-chi.vercel.app setava cookies lá e redirecionava
 * para genesis.vercel.app/gacha, onde não havia cookie → redirect para login → loop).
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
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        const target =
          profile?.is_admin && (next === "/gacha" || next === "/" || !next) ? "/admin" : redirectToPath;
        return NextResponse.redirect(`${origin}${target}`);
      }
      return NextResponse.redirect(`${origin}${redirectToPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
