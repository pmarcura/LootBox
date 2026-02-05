import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";

/** Opções de cookie compatíveis com Safari ITP: first-party, SameSite=Lax. */
const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

/**
 * Creates a Supabase server client. Cookie writes (set/remove) are wrapped in
 * try-catch because Next.js only allows cookie modification in Server Actions
 * or Route Handlers—not in Server Components. The middleware handles token
 * refresh; failed writes here are safely ignored when called from Components.
 * Cookies são explicitamente Same-Site para evitar bloqueio por ITP no Safari.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...SESSION_COOKIE_OPTIONS, ...options });
        } catch {
          // Ignored when called from Server Component (cookies are read-only there).
          // Middleware refreshes tokens; Server Actions/Route Handlers can write.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...SESSION_COOKIE_OPTIONS, ...options });
        } catch {
          // Ignored when called from Server Component.
        }
      },
    },
  });
}
