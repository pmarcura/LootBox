export const CODE_LENGTH = 12;
export const DATA_LENGTH = 11;
export const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CODE_PATTERN = "^[A-HJ-KM-NP-TV-Z2-9]{11}[2-9]$";

export function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}
