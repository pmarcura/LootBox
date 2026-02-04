import Link from "next/link";

import { EssenceBadge } from "@/components/ui/EssenceBadge";
import { ExperienceBar } from "@/components/ui/ExperienceBar";
import type { LayoutSession } from "@/lib/supabase/session";
import { UserMenu } from "./UserMenu";

type HeaderProps = { session: LayoutSession };

export function Header({ session }: HeaderProps) {
  const { user, profile } = session;
  const isAdmin = profile?.is_admin ?? false;
  const essenceBalance = profile?.essence_balance ?? 0;
  const experience = profile?.experience ?? 0;
  const displayName = profile?.display_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
        >
          <span className="text-lg font-semibold">Gênesis</span>
        </Link>

        {/* Navegação principal fica na barra inferior (NavBottomWrapper no layout) */}

        {/* Essence + XP + User Menu */}
        <div className="flex items-center gap-3 md:gap-4">
          {user && (
            <>
              <ExperienceBar experience={experience} compact showLevel />
              <EssenceBadge amount={essenceBalance} />
            </>
          )}
          <UserMenu
            user={user}
            userId={user?.id ?? null}
            isAdmin={isAdmin}
            displayName={displayName}
            avatarUrl={avatarUrl}
            essenceBalance={essenceBalance}
          />
        </div>
      </div>
    </header>
  );
}
