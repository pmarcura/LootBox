/**
 * Mapeamento de famílias de strains para identidade Street Biopunk
 * IDs técnicos (NEURO, SHELL, PSYCHO) mantidos no banco
 * Display names atualizados para nova nomenclatura
 */

export type StrainFamily = "NEURO" | "SHELL" | "PSYCHO";

export const STRAIN_FAMILY_DISPLAY: Record<StrainFamily, string> = {
  NEURO: "DISPOSIÇÃO ⚡",
  SHELL: "POSTURADO 🛡️",
  PSYCHO: "LARICA 🦷",
};

export const STRAIN_FAMILY_SHORT: Record<StrainFamily, string> = {
  NEURO: "DISPOSIÇÃO",
  SHELL: "POSTURADO",
  PSYCHO: "LARICA",
};

export function getStrainFamilyDisplay(family: StrainFamily, withEmoji = true): string {
  return withEmoji ? STRAIN_FAMILY_DISPLAY[family] : STRAIN_FAMILY_SHORT[family];
}
