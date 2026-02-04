"use client";

import * as React from "react";
import { Zap, Shield, Droplets } from "lucide-react";

const KEYWORD_TOOLTIP: Record<string, string> = {
  BLOCKER: "Taunt: inimigos sem bloqueador na faixa devem atacar este alvo",
  OVERCLOCK: "First Strike: ataca primeiro",
  VAMPIRISM: "Lifesteal: cura sua vida ao causar dano",
};

type KeywordIconsProps = {
  keyword: string;
  size?: number;
  className?: string;
};

/** Ícones minimalistas para keywords: OVERCLOCK (raio), BLOCKER (escudo), VAMPIRISM (gota). */
export function KeywordIcon({ keyword, size = 14, className = "" }: KeywordIconsProps) {
  const tooltip = KEYWORD_TOOLTIP[keyword];
  const icon =
    keyword === "OVERCLOCK" ? (
      <Zap size={size} className="text-amber-400" strokeWidth={2.5} />
    ) : keyword === "BLOCKER" ? (
      <Shield size={size} className="text-blue-400" strokeWidth={2.5} />
    ) : keyword === "VAMPIRISM" ? (
      <Droplets size={size} className="text-red-400" strokeWidth={2.5} />
    ) : null;

  if (!icon) return null;

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {icon}
    </span>
  );
}
