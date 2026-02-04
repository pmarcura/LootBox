import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/gacha";
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

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
        return NextResponse.redirect(`${origin.replace(/\/$/, "")}${target}`);
      }
      return NextResponse.redirect(`${origin.replace(/\/$/, "")}${redirectToPath}`);
    }
  }

  return NextResponse.redirect(`${origin.replace(/\/$/, "")}/login?error=auth_callback`);
}
