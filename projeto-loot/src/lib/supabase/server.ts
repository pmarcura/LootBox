import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";

/**
 * Creates a Supabase server client. Cookie writes (set/remove) are wrapped in
 * try-catch because Next.js only allows cookie modification in Server Actions
 * or Route Handlers—not in Server Components. The middleware handles token
 * refresh; failed writes here are safely ignored when called from Components.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignored when called from Server Component (cookies are read-only there).
          // Middleware refreshes tokens; Server Actions/Route Handlers can write.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Ignored when called from Server Component.
        }
      },
    },
  });
}
