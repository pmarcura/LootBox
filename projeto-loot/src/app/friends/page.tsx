import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FriendsPanel } from "@/features/friends/components/FriendsPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Amigos | Projeto Gênesis",
  description: "Adicione amigos e veja pedidos de amizade.",
};

export default async function FriendsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/friends");
  }

  const [friendsResult, incomingResult] = await Promise.all([
    supabase.from("friends").select("id, friend_id").eq("user_id", user.id),
    supabase
      .from("friend_requests")
      .select("id, from_user_id")
      .eq("to_user_id", user.id)
      .eq("status", "pending"),
  ]);

  const friendIds = (friendsResult.data ?? []).map((f) => f.friend_id);
  const fromIds = (incomingResult.data ?? []).map((r) => r.from_user_id);
  const profileIds = [...new Set([...friendIds, ...fromIds])];

  type ProfileRow = { id: string; display_name: string | null; avatar_url: string | null };
  let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", profileIds);
    profilesMap = (profiles ?? []).reduce(
      (acc, p: ProfileRow) => ({
        ...acc,
        [p.id]: { display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null },
      }),
      {} as Record<string, { display_name: string | null; avatar_url: string | null }>,
    );
  }

  const friends = (friendsResult.data ?? []).map((f) => ({
    id: f.id,
    friend_id: f.friend_id,
    display_name: profilesMap[f.friend_id]?.display_name ?? null,
    avatar_url: profilesMap[f.friend_id]?.avatar_url ?? null,
  }));

  const incomingRequests = (incomingResult.data ?? []).map((r) => ({
    id: r.id,
    from_user_id: r.from_user_id,
    display_name: profilesMap[r.from_user_id]?.display_name ?? null,
    avatar_url: profilesMap[r.from_user_id]?.avatar_url ?? null,
  }));

  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-50">Amigos</span>
        </nav>

        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Amigos</p>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Meus amigos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Adicione amigos por email e aceite pedidos para poder desafiar nos duelos.
          </p>
        </header>

        <FriendsPanel friends={friends} incomingRequests={incomingRequests} />
      </div>
    </main>
  );
}
