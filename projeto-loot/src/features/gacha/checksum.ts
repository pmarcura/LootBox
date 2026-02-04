import { ALPHABET, CODE_LENGTH, DATA_LENGTH, normalizeCode } from "./constants";

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

const alphabetIndex = new Map(
  ALPHABET.split("").map((char, index) => [char, index]),
);

function toNumericString(data: string): string {
  return data
    .split("")
    .map((char) => {
      const value = alphabetIndex.get(char);
      if (value === undefined) {
        throw new Error("invalid_character");
      }
      return value.toString().padStart(2, "0");
    })
    .join("");
}

function verhoeffComputeDigit(numberString: string): number {
  let c = 0;
  const reversed = numberString.split("").reverse();
  for (let i = 0; i < reversed.length; i += 1) {
    const num = Number(reversed[i]);
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][num]];
  }
  return VERHOEFF_INV[c];
}

export function computeCheckDigit(data: string): string {
  if (data.length !== DATA_LENGTH) {
    throw new Error("invalid_length");
  }
  const numeric = toNumericString(data);
  return String(verhoeffComputeDigit(numeric));
}

export function isValidCode(rawCode: string): boolean {
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) {
    return false;
  }
  const data = code.slice(0, -1);
  const check = code.slice(-1);
  if (!/^[A-HJ-KM-NP-TV-Z2-9]+$/.test(data)) {
    return false;
  }
  if (!/^[2-9]$/.test(check)) {
    return false;
  }
  const expected = computeCheckDigit(data);
  return expected === check;
}
