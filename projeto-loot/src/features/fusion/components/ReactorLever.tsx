"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";

type ReactorLeverProps = {
  onConfirm: () => void;
  disabled?: boolean;
  isPending?: boolean;
  className?: string;
};

export function ReactorLever({
  onConfirm,
  disabled = false,
  isPending = false,
  className,
}: ReactorLeverProps) {
  const [pulled, setPulled] = useState(false);

  const handleActivate = useCallback(() => {
    if (disabled || isPending || pulled) return;
    setPulled(true);
    onConfirm();
  }, [disabled, isPending, pulled, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || isPending || pulled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setPulled(true);
        onConfirm();
      }
    },
    [disabled, isPending, pulled, onConfirm],
  );

  const isActive = !disabled && !isPending && !pulled;

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        disabled={disabled || isPending}
        aria-label="Puxar alavanca para iniciar fusão"
        className={cn(
          "relative mx-auto flex h-24 w-full max-w-xs flex-col items-center justify-end rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0a0a0c]",
          "biopunk-panel-metal border-[var(--biopunk-metal-light)]",
          isActive && "hover:border-amber-500/60 hover:shadow-[var(--biopunk-glow-amber)] cursor-pointer",
          (disabled || isPending) && "cursor-not-allowed opacity-60",
          pulled && "opacity-80",
        )}
      >
        {/* Capa de acrílico / proteção */}
        <div className="absolute inset-x-4 top-2 h-8 rounded border border-amber-500/30 bg-amber-950/20" aria-hidden />
        {/* Alavanca estilo Frankenstein */}
        <div
          className={cn(
            "relative z-10 mb-2 flex h-14 w-16 flex-col items-center justify-end rounded-b-lg border-2 border-amber-600/80 bg-gradient-to-b from-amber-700/90 to-amber-900 transition-transform",
            isActive && "hover:scale-105 active:translate-y-1",
          )}
        >
          <div className="h-2 w-full rounded-t bg-amber-500/50" />
          <div className="h-10 w-6 rounded-b border-2 border-amber-600 bg-amber-800/80 shadow-inner" />
        </div>
        <span
          className="mb-3 text-[10px] font-bold uppercase tracking-widest text-amber-200/90"
          style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
        >
          {isPending ? "Iniciando…" : pulled ? "Ativado" : "Puxar alavanca"}
        </span>
      </button>
      <p className="text-center text-xs text-zinc-500">
        Ou pressione Enter para ativar (acessibilidade).
      </p>
    </div>
  );
}
