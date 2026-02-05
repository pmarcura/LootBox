"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { getStrainFamilyDisplay } from "@/lib/strain-family";
import { getRarityBadgeClass, getRaritySlotBg } from "../utils/rarityStyles";
import { StrainFamilyIcon } from "./StrainFamilyIcon";

export type VesselItem = {
  inventoryId: string;
  name: string;
  slug: string;
  rarity: string;
  baseHp: number;
  baseAtk: number;
  baseMana: number;
  imageUrl?: string | null;
};

export type StrainItem = {
  userStrainId: string;
  name: string;
  slug: string;
  rarity: string;
  family: string;
  imageUrl?: string | null;
};

type FusionSlotProps = {
  type: "vessel" | "strain";
  item: VesselItem | StrainItem | null;
  isPulsing?: boolean;
  onClick?: () => void;
  className?: string;
};

export function FusionSlot({
  type,
  item,
  isPulsing = false,
  onClick,
  className,
}: FusionSlotProps) {
  const isEmpty = item === null;

  if (type === "vessel") {
    const v = item as VesselItem | null;
    const hasImage = !isEmpty && v?.imageUrl;
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative flex min-h-[200px] w-full flex-col items-center justify-end overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-[var(--biopunk-cyan)] focus:ring-offset-2 focus:ring-offset-[#0a0a0c]",
          "biopunk-panel-metal rounded-lg border-2 border-[var(--biopunk-metal-light)]",
          isEmpty
            ? "text-zinc-500 hover:border-cyan-500/40 hover:shadow-[var(--biopunk-glow-cyan)]"
            : "border-cyan-400/70 text-zinc-100 shadow-[var(--biopunk-glow-cyan)]",
          className,
        )}
        aria-label={isEmpty ? "Selecionar monstro (hospedeiro)" : `Monstro selecionado: ${v?.name}. Clique para trocar`}
      >
        {/* Berço: garras hidráulicas (moldura) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="absolute inset-0 w-full h-full text-cyan-500/20" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path d="M 8 15 L 8 85 L 20 92 L 80 92 L 92 85 L 92 15 L 80 8 L 20 8 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 15 20 L 15 80 M 85 20 L 85 80 M 20 15 L 80 15 M 20 85 L 80 85" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          </svg>
        </div>
        <div className="relative w-full shrink-0 aspect-[2816/1536] overflow-hidden bg-zinc-900/80 rounded-t-md border-b border-[var(--biopunk-metal-light)]">
          {hasImage && (
            <>
              <Image
                src={v!.imageUrl!}
                alt=""
                fill
                className="object-contain"
                sizes="(max-width: 768px) 50vw, 300px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />
            </>
          )}
          {!hasImage && !isEmpty && (
            <div className={cn("absolute inset-0", getRaritySlotBg(v!.rarity))} />
          )}
          {isEmpty && (
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--biopunk-metal-dark)] to-zinc-900/90" />
          )}
        </div>
        <div className="relative z-10 w-full p-3 text-center border-t border-[var(--biopunk-metal-light)]/80">
          {isEmpty ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-500/10 ring-2 ring-cyan-400/30 border border-cyan-400/20">
                <svg className="h-8 w-8 text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-cyan-200/90">
                Tanque hospedeiro
              </span>
              <span className="mt-0.5 block text-[10px] text-zinc-500">Aguardando placa</span>
            </>
          ) : (
            <>
              <span className="line-clamp-2 font-semibold drop-shadow-lg">{v!.name}</span>
              <span className={cn("mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", getRarityBadgeClass(v!.rarity))}>
                {v!.rarity}
              </span>
              <span className="mt-1.5 block text-xs text-zinc-300">HP {v!.baseHp} / ATK {v!.baseAtk} / Mana {v!.baseMana}</span>
            </>
          )}
        </div>
      </button>
    );
  }

  const s = item as StrainItem | null;
  const hasImage = !isEmpty && s?.imageUrl;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex min-h-[200px] w-full flex-col items-center justify-end overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-[var(--biopunk-toxic)] focus:ring-offset-2 focus:ring-offset-[#0a0a0c]",
        "rounded-lg border-2 bg-[var(--biopunk-glass)] backdrop-blur-sm",
        "border-[var(--biopunk-metal-light)]",
        isEmpty
          ? "text-zinc-500 hover:border-emerald-500/40 hover:shadow-[var(--biopunk-glow-toxic)]"
          : "border-emerald-400/70 text-zinc-100 shadow-[var(--biopunk-glow-toxic)]",
        isPulsing && isEmpty && "animate-pulse border-emerald-500/70",
        className,
      )}
      aria-label={isEmpty ? "Selecionar planta (strain)" : `Planta selecionada: ${s?.name}. Clique para trocar`}
    >
      {/* Receptáculo vidro + bobinas Tesla (decorativo) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg className="absolute inset-0 w-full h-full text-emerald-500/15" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <ellipse cx="50" cy="50" rx="42" ry="40" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M 30 30 Q 50 20 70 30 M 30 70 Q 50 80 70 70" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
        </svg>
      </div>
      <div className="relative w-full shrink-0 aspect-[2816/1536] overflow-hidden bg-zinc-900/70 rounded-t-md border-b border-emerald-500/20">
        {hasImage && (
          <>
            <Image src={s!.imageUrl!} alt="" fill className="object-contain" sizes="(max-width: 768px) 50vw, 300px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />
          </>
        )}
        {!hasImage && !isEmpty && <div className={cn("absolute inset-0", getRaritySlotBg(s!.rarity))} />}
        {isEmpty && (
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--biopunk-metal-dark)]/90 to-zinc-900/80" />
        )}
      </div>
      <div className="relative z-10 w-full p-3 text-center border-t border-emerald-500/20">
        {isEmpty ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-500/10 ring-2 ring-emerald-400/30 border border-emerald-400/20">
              <svg className="h-8 w-8 text-emerald-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-emerald-200/90">
              Injetor genético
            </span>
            <span className="mt-0.5 block text-[10px] text-zinc-500">Aguardando strain</span>
          </>
        ) : (
          <>
            <span className="line-clamp-2 font-semibold drop-shadow-lg">{s!.name}</span>
            <span className={cn("mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", getRarityBadgeClass(s!.rarity))}>
              {s!.rarity}
            </span>
            <span className="mt-1.5 flex items-center justify-center gap-1 text-xs text-zinc-300">
              <StrainFamilyIcon family={s!.family} size="sm" />
              <span className="uppercase tracking-wider">{getStrainFamilyDisplay(s!.family as "NEURO" | "SHELL" | "PSYCHO", false)}</span>
            </span>
          </>
        )}
      </div>
    </button>
  );
}
