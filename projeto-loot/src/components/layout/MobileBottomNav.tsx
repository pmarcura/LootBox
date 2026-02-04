"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: (className?: string) => React.ReactNode;
};

const mainNavItems: NavItem[] = [
  {
    href: "/gacha",
    label: "Resgatar",
    shortLabel: "Resgatar",
    icon: (className = "h-6 w-6") => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  {
    href: "/inventory",
    label: "Inventário",
    shortLabel: "Mochila",
    icon: (className = "h-6 w-6") => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/fusion",
    label: "Fusão",
    shortLabel: "Fusão",
    icon: (className = "h-6 w-6") => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517L6 18.089V9a2 2 0 012-2h10a2 2 0 012 2v9.089l-2.161-1.194a6 6 0 00-3.86-.517l-2.386.477a2 2 0 00-1.022.547l-1.572 1.572a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 010-1.414l1.572-1.572z" />
      </svg>
    ),
  },
  {
    href: "/duels",
    label: "Duelos",
    shortLabel: "Duelos",
    icon: (className = "h-6 w-6") => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: "/friends",
    label: "Amigos",
    shortLabel: "Amigos",
    icon: (className = "h-6 w-6") => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

type MobileBottomNavProps = {
  isAdmin?: boolean;
};

export function MobileBottomNav({ isAdmin }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/98 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação principal"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-stretch justify-around">
          {mainNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors touch-manipulation active:bg-zinc-800/80 ${
                  active ? "text-violet-400" : "text-zinc-500"
                }`}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
              >
                {item.icon("h-6 w-6 shrink-0")}
                <span className="text-[10px] font-medium leading-tight max-w-[64px] truncate text-center">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
          <div className="relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors touch-manipulation active:bg-zinc-800/80 ${
                moreOpen ? "text-amber-400" : "text-zinc-500"
              }`}
              aria-label="Mais opções"
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              <span className="text-[10px] font-medium leading-tight">Mais</span>
            </button>
            {moreOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => setMoreOpen(false)}
                />
                <div
                  className="absolute bottom-full left-1/2 z-50 mb-1 w-48 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
                  role="menu"
                >
                  <Link
                    href="/marketplace"
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-3 text-sm transition-colors ${
                      pathname.startsWith("/marketplace") ? "text-violet-400" : "text-zinc-200"
                    }`}
                  >
                    Marketplace
                  </Link>
                  <Link
                    href="/clan"
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-3 text-sm transition-colors ${
                      pathname.startsWith("/clan") ? "text-violet-400" : "text-zinc-200"
                    }`}
                  >
                    Clã
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/playground"
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className={`block px-4 py-3 text-sm transition-colors ${
                        pathname.startsWith("/playground") ? "text-amber-400" : "text-zinc-200"
                      }`}
                    >
                      Playground
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className={`block px-4 py-3 text-sm transition-colors ${
                        pathname === "/admin" ? "text-amber-400" : "text-zinc-200"
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
