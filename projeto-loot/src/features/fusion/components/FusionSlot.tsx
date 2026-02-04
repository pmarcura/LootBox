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
          "relative flex min-h-[200px] w-full flex-col items-center justify-end overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black",
          isEmpty
            ? "border-zinc-600 border-dashed bg-zinc-900/50 text-zinc-500 hover:border-zinc-500 hover:bg-zinc-800/50"
            : cn(
                "border-cyan-400/90 text-zinc-100 shadow-[0_0_20px_rgba(34,211,238,0.4),0_0_40px_rgba(34,211,238,0.15)]",
              ),
          className,
        )}
        aria-label={isEmpty ? "Selecionar monstro (hospedeiro)" : `Monstro selecionado: ${v?.name}. Clique para trocar`}
      >
        {hasImage && (
          <>
            <Image
              src={v!.imageUrl!}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 50vw, 300px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
          </>
        )}
        {!hasImage && !isEmpty && (
          <div className={cn("absolute inset-0", getRaritySlotBg(v!.rarity))} />
        )}
        <div className="relative z-10 w-full p-3 text-center">
          {isEmpty ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 ring-2 ring-cyan-400/30">
                <svg
                  className="h-9 w-9 text-cyan-400/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="mt-2 block text-sm font-semibold uppercase tracking-wider text-cyan-200/90">
                Monstro
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">Escolha um hospedeiro</span>
            </>
          ) : (
            <>
              <span className="line-clamp-2 font-semibold drop-shadow-lg">
                {v!.name}
              </span>
              <span
                className={cn(
                  "mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                  getRarityBadgeClass(v!.rarity),
                )}
              >
                {v!.rarity}
              </span>
              <span className="mt-1.5 block text-xs text-zinc-300">
                HP {v!.baseHp} / ATK {v!.baseAtk} / Mana {v!.baseMana}
              </span>
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
        "relative flex min-h-[200px] w-full flex-col items-center justify-end overflow-hidden rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black",
        isEmpty
          ? "border-zinc-600 border-dashed bg-zinc-900/50 text-zinc-500 hover:border-zinc-500 hover:bg-zinc-800/50"
          : cn(
              "border-emerald-400/90 text-zinc-100 shadow-[0_0_20px_rgba(52,211,153,0.4),0_0_40px_rgba(52,211,153,0.15)]",
            ),
        isPulsing && isEmpty && "animate-pulse border-emerald-500/70",
        className,
      )}
      aria-label={isEmpty ? "Selecionar planta (strain)" : `Planta selecionada: ${s?.name}. Clique para trocar`}
    >
      {hasImage && (
        <>
          <Image
            src={s!.imageUrl!}
            alt=""
            fill
            className="object-cover object-center rounded-full"
            sizes="(max-width: 768px) 50vw, 300px"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
        </>
      )}
      {!hasImage && !isEmpty && (
        <div className={cn("absolute inset-0 rounded-full", getRaritySlotBg(s!.rarity))} />
      )}
      <div className="relative z-10 w-full p-3 text-center">
        {isEmpty ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-400/30">
              <svg
                className="h-9 w-9 text-emerald-400/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="mt-2 block text-sm font-semibold uppercase tracking-wider text-emerald-200/90">
              Planta
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500">Escolha uma strain</span>
          </>
        ) : (
          <>
            <span className="line-clamp-2 font-semibold drop-shadow-lg">
              {s!.name}
            </span>
            <span
              className={cn(
                "mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                getRarityBadgeClass(s!.rarity),
              )}
            >
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
