"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/cn";

const THRESHOLD = 100;

type SlideToConfirmProps = {
  onConfirm: () => void;
  disabled?: boolean;
  isPending?: boolean;
  label?: string;
  className?: string;
};

export function SlideToConfirm({
  onConfirm,
  disabled = false,
  isPending = false,
  label = "ARRASTE PARA INICIAR SESSÃO",
  className,
}: SlideToConfirmProps) {
  const [value, setValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const getProgress = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || isPending || hasSubmitted) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      setIsDragging(true);
      setValue(getProgress(e.clientX));
    },
    [disabled, isPending, hasSubmitted, getProgress],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || disabled || isPending) return;
      setValue(getProgress(e.clientX));
    },
    [isDragging, disabled, isPending, getProgress],
  );

  const handlePointerUp = useCallback(
    (e?: React.PointerEvent) => {
      if (e) (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (!isDragging) return;
      setIsDragging(false);
      if (value >= THRESHOLD - 2 && !hasSubmitted) {
        setHasSubmitted(true);
        onConfirm();
      } else {
        setValue(0);
      }
    },
    [isDragging, value, onConfirm, hasSubmitted],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || isPending || hasSubmitted) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setHasSubmitted(true);
        onConfirm();
      }
    },
    [disabled, isPending, onConfirm, hasSubmitted],
  );

  const isActive = !disabled && !isPending && !hasSubmitted;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={trackRef}
        role="slider"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Deslize até o fim para confirmar sessão"
        aria-disabled={disabled || isPending}
        tabIndex={disabled || isPending ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => handlePointerUp(e)}
        onPointerLeave={() => handlePointerUp()}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative h-16 w-full cursor-grab select-none overflow-hidden rounded-full border-2 border-cyan-500/50 bg-zinc-900/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black active:cursor-grabbing",
          (disabled || isPending) && "cursor-not-allowed opacity-60",
        )}
      >
        {/* Líquido (preenchimento) com efeito borbulhante quando ativo */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-full transition-all duration-150"
          style={{
            width: `${value}%`,
            background: "linear-gradient(90deg, rgba(34,211,238,0.4) 0%, rgba(52,211,153,0.5) 100%)",
            boxShadow: "inset 0 0 20px rgba(34,211,238,0.3)",
          }}
        >
          {isActive && value > 5 && (
            <div className="syringe-bubbles absolute inset-0 overflow-hidden rounded-l-full" aria-hidden>
              <span className="bubble" />
              <span className="bubble" />
              <span className="bubble" />
              <span className="bubble" />
              <span className="bubble" />
            </div>
          )}
        </div>

        {/* Êmbolo (thumb) na frente do líquido */}
        <div
          className="absolute inset-y-0 z-10 flex items-center"
          style={{ left: `calc(${value}% - 18px)` }}
        >
          <div
            className="h-12 w-9 shrink-0 rounded-lg border-2 border-cyan-400/80 bg-zinc-800 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
          />
        </div>

        {/* Texto central */}
        <div className="relative z-5 flex h-full w-full items-center justify-center px-14">
          <span
            className="text-center text-sm font-bold uppercase tracking-[0.2em] text-zinc-300 drop-shadow-lg"
            style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
          >
            {label}
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-zinc-500">
        Ou pressione Enter para confirmar sessão (acessibilidade).
      </p>
    </div>
  );
}
