"use client";

import { forwardRef, useEffect, useRef } from "react";

import { Button } from "@/components/ui/Button";
import type { DropResult } from "../../types";

type RevealSummaryProps = {
  drops: DropResult[];
  onClose: () => void;
  onContinue: () => void;
};

export const RevealSummary = forwardRef<HTMLDivElement, RevealSummaryProps>(
  function RevealSummary({ drops, onClose, onContinue }, ref) {
    const continueRef = useRef<HTMLButtonElement>(null);
    const count = drops.length;

    useEffect(() => {
      continueRef.current?.focus();
    }, []);

    const announceText =
      count === 1
        ? `Você obteve o vessel ${drops[0]!.vessel.collectibleName} e a strain ${drops[0]!.strain.name}. 1 vessel e 1 strain adicionados ao inventário.`
        : `${count} vessels e ${count} strains adicionados ao inventário.`;

    return (
      <div
        ref={ref}
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-8 pt-20 pb-[var(--content-bottom-safe)]"
        role="region"
        aria-label="Resultado da revelação"
      >
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announceText}
        </p>

        <p className="text-center text-base text-zinc-300 sm:text-lg">
          {count === 1
            ? "1 Vessel e 1 Strain adicionados ao inventário!"
            : `${count} vessels e ${count} strains adicionados ao inventário!`}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={onClose}
            variant="secondary"
            className="min-h-[44px] outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            Resgatar outro
          </Button>
          <Button
            ref={continueRef}
            onClick={onContinue}
            className="min-h-[44px] outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Continuar para ver as cartas em 3D"
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }
);
