import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import path from "path";

import { requireSupabaseAdminEnv } from "@/lib/supabase/env-validation";

const DEFAULT_EMAIL = "broomarcura@gmail.com";
const DEFAULT_PASSWORD = "admin123";

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (!key || rest.length === 0) continue;
      if (!process.env[key]) {
        process.env[key] = rest.join("=").trim();
      }
    }
  } catch {
    // ignora se .env.local não existir
  }
}

async function main() {
  const email = getArgValue("--email") ?? DEFAULT_EMAIL;
  loadEnvLocal();
  requireSupabaseAdminEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const password = getArgValue("--password") ?? DEFAULT_PASSWORD;

  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw new Error("Falha ao listar usuários.");
  }

  const user = data.users.find((item) => item.email === email);
  let targetUser = user;
  if (!targetUser) {
    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (createError || !createdUser.user) {
      throw new Error(`Falha ao criar usuário admin: ${email}.`);
    }
    targetUser = createdUser.user;
  }

  const { error: upsertError } = await admin.from("profiles").upsert({
    id: targetUser.id,
    is_admin: true,
  });

  if (upsertError) {
    throw new Error("Falha ao promover admin.");
  }

  console.log(`Admin configurado: ${email}`);
}

main().catch((error) => {
  console.error("Erro no bootstrap-admin:", error);
  process.exit(1);
});
