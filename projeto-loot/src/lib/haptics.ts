/**
 * Vibration API: feedback tátil no mobile.
 * Use para: carta em campo, efeito resolvido, slot preenchido, etc.
 */

export function vibrateLight(): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(30);
  }
}

export function vibrateHeavy(): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }
}
