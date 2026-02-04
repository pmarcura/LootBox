import Link from "next/link";

type EssenceBadgeProps = {
  amount: number;
  href?: string;
  className?: string;
};

/**
 * Badge de essência padronizado do design system.
 * Único componente para exibir saldo de essência na UI.
 */
export function EssenceBadge({
  amount,
  href = "/marketplace",
  className = "",
}: EssenceBadgeProps) {
  const content = (
    <>
      <span className="tabular-nums">{amount}</span>
      <span>essência</span>
    </>
  );

  const baseClasses =
    "inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50/80 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-900/50";

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${className}`.trim()}>
        {content}
      </Link>
    );
  }

  return (
    <span className={`${baseClasses} ${className}`.trim()}>{content}</span>
  );
}
