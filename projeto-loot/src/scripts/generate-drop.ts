import { randomInt } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";

import { ALPHABET, DATA_LENGTH } from "../features/gacha/constants";
import { computeCheckDigit } from "../features/gacha/checksum";

const TOTAL_CODES = 5000;
const REDEEM_BASE_URL = "https://universo-genesis.com/resgate?c=";
const OUTPUT_FILE = "drop_season_01_print.csv";

function randomChar(): string {
  return ALPHABET[randomInt(0, ALPHABET.length)];
}

function generateDataChunk(): string {
  let value = "";
  for (let i = 0; i < DATA_LENGTH; i += 1) {
    value += randomChar();
  }
  return value;
}

function generateCode(): string {
  while (true) {
    const data = generateDataChunk();
    const checkDigit = computeCheckDigit(data);
    if (checkDigit === "0" || checkDigit === "1") {
      continue;
    }
    return `${data}${checkDigit}`;
  }
}

async function main() {
  const codes = new Set<string>();

  while (codes.size < TOTAL_CODES) {
    codes.add(generateCode());
  }

  const rows = ["code,redeem_url"];
  for (const code of codes) {
    rows.push(`${code},${REDEEM_BASE_URL}${code}`);
  }

  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  await writeFile(outputPath, `${rows.join("\n")}\n`, "utf8");

  console.log(`Gerados ${codes.size} códigos em ${outputPath}`);
}

main().catch((error) => {
  console.error("Falha ao gerar códigos:", error);
  process.exit(1);
});
