"use client";

/**
 * Fallback quando a imagem do item falha ao carregar.
 * "Sinal de radar criptografado" — silhueta pulsante + texto de terminal (lore-friendly).
 */
export function CorruptedDataPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-900/90 p-4">
      <svg
        className="h-16 w-16 text-cyan-500/80 animate-pulse"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.5" />
      </svg>
      <div className="text-center font-mono text-[10px] uppercase tracking-wider text-cyan-400/90">
        <p>DADOS CORROMPIDOS</p>
        <p className="mt-1 animate-pulse">TENTANDO RECONEXÃO</p>
      </div>
    </div>
  );
}
