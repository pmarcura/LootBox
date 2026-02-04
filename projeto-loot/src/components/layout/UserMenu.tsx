"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { User } from "@supabase/supabase-js";

import { AvatarImage } from "@/components/ui/AvatarImage";
import { logoutAction } from "@/features/auth/actions";

type UserMenuProps = {
  user: User | null;
  userId?: string | null;
  isAdmin?: boolean;
  essenceBalance?: number;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export function UserMenu({ user, userId, isAdmin, displayName: profileDisplayName, avatarUrl }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Criar conta
        </Link>
      </div>
    );
  }

  const email = user.email ?? "Usuário";
  const displayName =
    profileDisplayName?.trim() || email.split("@")[0] || "Usuário";
  const initial = displayName.charAt(0).toUpperCase();

  const profileHref = userId ? `/profile/${userId}` : null;

  return (
    <div className="flex items-center gap-3">
      {/* Avatar + nome clicáveis para ir ao perfil */}
      <div className="flex items-center gap-2 md:gap-3">
        {profileHref ? (
          <Link
            href={profileHref}
            className="flex flex-col items-end transition-opacity hover:opacity-90"
            title="Ver meu perfil"
          >
            <span className="hidden text-sm font-medium text-zinc-900 md:block dark:text-zinc-50">
              {displayName}
            </span>
            <span className="hidden text-xs text-zinc-500 md:block">
              {isAdmin ? "Administrador" : "Colecionador"}
            </span>
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt=""
                size={32}
                className="h-8 w-8 ring-2 ring-transparent transition-[box-shadow] hover:ring-amber-400/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 transition-colors hover:bg-amber-100 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-amber-900/30">
                {initial}
              </div>
            )}
          </Link>
        ) : (
          <div className="flex flex-col items-end">
            <span className="hidden text-sm font-medium text-zinc-900 md:block dark:text-zinc-50">
              {displayName}
            </span>
            <span className="hidden text-xs text-zinc-500 md:block">
              {isAdmin ? "Administrador" : "Colecionador"}
            </span>
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt=""
                size={32}
                className="h-8 w-8"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                {initial}
              </div>
            )}
          </div>
        )}
      </div>
      <form
        action={() => {
          startTransition(() => {
            logoutAction();
          });
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 md:px-4 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {isPending ? "..." : "Sair"}
        </button>
      </form>
    </div>
  );
}
