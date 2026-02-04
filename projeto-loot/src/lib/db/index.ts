import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Database connection for Drizzle ORM.
 * Uses DATABASE_URL (Supabase Postgres connection string from Settings > Database).
 * Prefer pooler/transaction mode for serverless; set prepare: false.
 */
function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for Drizzle. Add it to .env.local (Supabase: Settings > Database > Connection string, use pooler)."
    );
  }
  return url;
}

let _client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!_client) {
    const url = getConnectionString();
    _client = postgres(url, { prepare: false, max: 4 });
  }
  return _client;
}

export const db = drizzle(getClient(), { schema });

export type Db = typeof db;

/**
 * Returns { db, userId } after validating the session.
 * Use in Server Actions that need authenticated DB access.
 * Throws if not authenticated.
 */
export async function getDbWithAuth(): Promise<{
  db: Db;
  userId: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("not_authenticated");
  }

  return { db, userId: user.id };
}
