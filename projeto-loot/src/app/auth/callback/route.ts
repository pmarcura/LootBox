import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/gacha";

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
