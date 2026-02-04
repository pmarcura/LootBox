"use client";

import { cn } from "@/lib/cn";

const FLAVOR_MESSAGES = [
  "Compatibilidade Genética: 98%",
  "Preparando Vetor Viral…",
  "Alerta: Strain instável detectada.",
  "Sistema pronto para sessão.",
  "Análise de DNA em andamento…",
];

type FlavorTickerProps = {
  messageIndex?: number;
  className?: string;
};

export function FlavorTicker({
  messageIndex = 0,
  className,
}: FlavorTickerProps) {
  const msg =
    FLAVOR_MESSAGES[messageIndex % FLAVOR_MESSAGES.length] ??
    FLAVOR_MESSAGES[0];

  return (
    <p
      className={cn(
        "font-mono text-xs uppercase tracking-wider text-zinc-500",
        className,
      )}
      aria-live="polite"
    >
      {msg}
    </p>
  );
}
