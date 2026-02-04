import { createHash } from "crypto";
import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

import { requireSupabaseAdminEnv } from "@/lib/supabase/env-validation";
import { isValidCode } from "../features/gacha/checksum";
import { normalizeCode } from "../features/gacha/constants";
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
    // ignora se .env.local não existir
  }
}

type CodeRow = {
  code: string;
  hash: string;
};

const DEFAULT_FILE = "drop_season_01_print.csv";
const DEFAULT_BATCH = "season01";
const CHUNK_SIZE = 500;

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function parseCsv(content: string): string[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return [];
  }
  const [, ...rows] = lines;
  return rows
    .map((line) => line.split(",")[0]?.trim())
    .filter((value): value is string => Boolean(value));
}

async function loadCodes(filePath: string): Promise<CodeRow[]> {
  const raw = await readFile(path.join(process.cwd(), filePath), "utf8");
  const codes = parseCsv(raw);
  const rows: CodeRow[] = [];

  for (const rawCode of codes) {
    if (!isValidCode(rawCode)) {
      console.warn(`Código inválido ignorado: ${rawCode}`);
      continue;
    }
    const code = normalizeCode(rawCode);
    rows.push({ code, hash: hashCode(code) });
  }

  return rows;
}

async function insertCodes(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  rows: CodeRow[],
  batchId: string,
) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const values = chunk.map((row) => ({
      code_hash: row.hash,
      batch_id: batchId,
      is_active: true,
    }));

    const { error } = await supabase
      .from("redemption_codes")
      .upsert(values, { onConflict: "code_hash", ignoreDuplicates: true });

    if (error) {
      throw new Error(`Falha ao inserir lote: ${error.message}`);
    }
  }
}

async function main() {
  loadEnvLocal();
  requireSupabaseAdminEnv();

  const filePath = getArgValue("--file") ?? DEFAULT_FILE;
  const batchId = getArgValue("--batch") ?? DEFAULT_BATCH;

  const supabase = createSupabaseAdminClient();

  const rows = await loadCodes(filePath);
  if (rows.length === 0) {
    throw new Error("Nenhum código válido encontrado.");
  }

  await insertCodes(supabase, rows, batchId);

  console.log(
    `Import concluído: ${rows.length} códigos válidos no batch ${batchId}.`,
  );
}

main().catch((error) => {
  console.error("Falha ao importar códigos:", error);
  process.exit(1);
});
