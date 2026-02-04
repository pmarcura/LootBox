import * as React from "react";

import { cn } from "@/lib/cn";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "common" | "uncommon" | "rare" | "epic" | "legendary";
};

const toneStyles: Record<NonNullable<BadgeProps["tone"]>, string> = {
  common: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50",
  uncommon:
    "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  rare: "bg-sky-200 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  epic: "bg-violet-200 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100",
  legendary:
    "bg-amber-200 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100",
};

export function Badge({
  className,
  tone = "common",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
