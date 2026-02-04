"use client";

import { cn } from "@/lib/cn";

export type StrainFamily = "NEURO" | "SHELL" | "PSYCHO";

const familyConfig: Record<
  StrainFamily,
  { label: string; className: string; viewBox: string; path: string }
> = {
  NEURO: {
    label: "DISPOSIÇÃO",
    className: "text-violet-400",
    viewBox: "0 0 24 24",
    path: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  SHELL: {
    label: "POSTURADO",
    className: "text-emerald-400",
    viewBox: "0 0 24 24",
    path: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  PSYCHO: {
    label: "LARICA",
    className: "text-amber-400",
    viewBox: "0 0 24 24",
    path: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318 1.318a4.5 4.5 0 00-6.364 6.364z",
  },
};

type StrainFamilyIconProps = {
  family: StrainFamily | string;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
};

export function StrainFamilyIcon({
  family,
  className,
  size = "md",
  showLabel = false,
}: StrainFamilyIconProps) {
  const key = family as StrainFamily;
  const config = familyConfig[key] ?? {
    label: String(family),
    className: "text-zinc-400",
    viewBox: "0 0 24 24",
    path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={config.label}
    >
      <svg
        className={cn(sizeClass, "shrink-0", config.className)}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox={config.viewBox}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={config.path}
        />
      </svg>
      {showLabel && (
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {config.label}
        </span>
      )}
    </span>
  );
}
