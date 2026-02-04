import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("@/lib/db");
  const start = performance.now();
  await db.execute(sql`select 1`);
  const elapsed = ((performance.now() - start) / 1000).toFixed(3);
  console.log(`✅ Drizzle connection ok (select 1) – ${elapsed}s`);
}

main().catch((error) => {
  console.error("❌ Drizzle connection failed:", error);
  process.exitCode = 1;
});
