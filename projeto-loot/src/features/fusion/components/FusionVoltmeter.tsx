"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type FusionVoltmeterProps = {
  /** 0–100: nível de "voltagem" para o ponteiro */
  value?: number;
  className?: string;
};

export function FusionVoltmeter({ value = 0, className }: FusionVoltmeterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Math.min(100, Math.max(0, value));
    const timer = setTimeout(() => {
      setDisplayValue((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 2) return target;
        return prev + (diff > 0 ? 4 : -4);
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [value, displayValue]);

  const rotation = -90 + (displayValue / 100) * 180;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-amber-500/40 bg-zinc-950/90 px-4 py-3",
        className,
      )}
      aria-hidden
    >
      <span className="mb-1 text-[9px] font-mono uppercase tracking-wider text-amber-400/80">
        Voltagem de fusão
      </span>
      <div className="relative h-16 w-24 rounded border border-amber-600/50 bg-zinc-900">
        {/* Escala analógica */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 60" preserveAspectRatio="none">
          <path
            d="M 20 50 A 35 35 0 0 1 80 50"
            fill="none"
            stroke="var(--biopunk-amber-dim)"
            strokeWidth="2"
          />
          {[0, 25, 50, 75, 100].map((p) => (
            <line
              key={p}
              x1={20 + (p / 100) * 60}
              y1={50}
              x2={20 + (p / 100) * 60}
              y2={45}
              stroke="var(--biopunk-amber-dim)"
              strokeWidth="1"
            />
          ))}
        </svg>
        {/* Ponteiro */}
        <div
          className="absolute left-1/2 top-[52%] h-1 w-8 origin-right rounded-sm bg-amber-400 shadow-[var(--biopunk-glow-amber)]"
          style={{
            transform: `translateY(-50%) rotate(${rotation}deg)`,
            transition: "transform 0.08s ease-out",
          }}
        />
      </div>
      <span className="mt-1 font-mono text-xs text-amber-300/90">{Math.round(displayValue)}%</span>
    </div>
  );
}
