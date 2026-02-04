/**
 * Gera códigos de resgate válidos e insere no banco (redemption_codes).
 * Uso: npm run seed:test-codes
 *       npm run seed:test-codes -- --count 50
 * Imprime os códigos no final para você copiar e resgatar em /gacha.
 */
import { createHash } from "crypto";
import { randomInt } from "crypto";
import { readFileSync } from "fs";
import path from "path";

import { ALPHABET, DATA_LENGTH, normalizeCode } from "../features/gacha/constants";
import { computeCheckDigit } from "../features/gacha/checksum";
import { createSupabaseAdminClient } from "./supabase-admin";

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
    // ignora
  }
}

function randomChar(): string {
  return ALPHABET[randomInt(0, ALPHABET.length)];
}

function generateCode(): string {
  let data = "";
  for (let i = 0; i < DATA_LENGTH; i += 1) {
    data += randomChar();
  }
  const checkDigit = computeCheckDigit(data);
  if (checkDigit === "0" || checkDigit === "1") {
    return generateCode();
  }
  return `${data}${checkDigit}`;
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

const BATCH = "test-codes";

function parseCount(): number {
  const idx = process.argv.indexOf("--count");
  if (idx === -1 || !process.argv[idx + 1]) return 10;
  const n = parseInt(process.argv[idx + 1], 10);
  return Number.isNaN(n) || n < 1 ? 10 : Math.min(n, 500);
}

async function main() {
  loadEnvLocal();

  const howMany = parseCount();
  const codes = new Set<string>();
  while (codes.size < howMany) {
    codes.add(generateCode());
  }
  const codeList = Array.from(codes);
  const normalized = codeList.map((c) => normalizeCode(c));

  const hasSupabase =
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (hasSupabase) {
    try {
      const supabase = createSupabaseAdminClient();
      const values = normalized.map((code) => ({
        code_hash: hashCode(code),
        batch_id: BATCH,
        is_active: true,
      }));
      const { error } = await supabase
        .from("redemption_codes")
        .upsert(values, { onConflict: "code_hash", ignoreDuplicates: true });
      if (error) throw error;
      console.log(`\n${values.length} códigos inseridos no banco (batch: ${BATCH}).\n`);
    } catch (e) {
      console.error("Erro ao inserir no Supabase:", e);
      console.log("Códigos gerados abaixo; insira manualmente se precisar.\n");
    }
  } else {
    console.log(
      "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos. Códigos gerados abaixo; configure .env.local e rode o seed ou insira manualmente.\n",
    );
  }

  console.log("--- Códigos para resgatar (1 vessel + 1 strain por código) ---\n");
  normalized.forEach((code, i) => {
    console.log(`  ${i + 1}. ${code}`);
  });
  console.log("\nCole um código em /gacha e clique em Resgatar.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
