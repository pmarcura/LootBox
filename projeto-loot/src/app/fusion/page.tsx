import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FusionLab } from "@/features/fusion/components/FusionLab";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lab de Fusão | Projeto Gênesis",
  description: "Câmara de Sessão — combine 1 monstro e 1 planta para o bicho fazer sessão e virar carta jogável. Ambos são consumidos na fusão.",
};

export default async function FusionPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/fusion");
  }

  const { data: vesselRows } = await supabase
    .from("user_inventory")
    .select(
      "id, collectible:collectibles_catalog(id, name, slug, rarity, base_hp, base_atk, base_mana, image_url)",
    )
    .eq("user_id", user.id)
    .eq("is_used", false)
    .order("acquired_at", { ascending: false });

  const { data: strainRows } = await supabase
    .from("user_strains")
    .select("id, strain:strains_catalog(id, name, slug, rarity, family, image_url)")
    .eq("user_id", user.id)
    .eq("is_used", false)
    .order("acquired_at", { ascending: false });

  type VesselRow = {
    id: string;
    collectible: { id: string; name: string; slug: string; rarity: string; base_hp: number; base_atk: number; base_mana: number; image_url?: string | null } | { id: string; name: string; slug: string; rarity: string; base_hp: number; base_atk: number; base_mana: number; image_url?: string | null }[];
  };

  type StrainRow = {
    id: string;
    strain: { id: string; name: string; slug: string; rarity: string; family: string; image_url?: string | null } | { id: string; name: string; slug: string; rarity: string; family: string; image_url?: string | null }[];
  };

  const vessels = ((vesselRows ?? []) as VesselRow[]).map((r) => {
    const c = Array.isArray(r.collectible) ? r.collectible[0] : r.collectible;
    return {
      inventoryId: r.id,
      name: c?.name ?? "",
      slug: c?.slug ?? "",
      rarity: c?.rarity ?? "common",
      baseHp: c?.base_hp ?? 0,
      baseAtk: c?.base_atk ?? 0,
      baseMana: c?.base_mana ?? 0,
      imageUrl: c?.image_url ?? null,
    };
  });

  const strains = ((strainRows ?? []) as StrainRow[]).map((r) => {
    const s = Array.isArray(r.strain) ? r.strain[0] : r.strain;
    return {
      userStrainId: r.id,
      name: s?.name ?? "",
      slug: s?.slug ?? "",
      rarity: s?.rarity ?? "common",
      family: s?.family ?? "",
      imageUrl: s?.image_url ?? null,
    };
  });

  return (
    <main className="fusion-lab-page relative min-h-screen bg-black px-4 py-8 text-zinc-100 sm:px-6">
      <div className="fusion-scanline absolute inset-0 pointer-events-none opacity-[0.03]" aria-hidden />
      <div className="fusion-grid-pattern absolute inset-0 pointer-events-none opacity-[0.06]" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8">
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Início
          </Link>
          <span>/</span>
          <Link href="/inventory" className="hover:text-zinc-300">
            Inventário
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-100">Lab de Fusão</span>
        </nav>

        <header className="space-y-1">
          <h1
            className="text-2xl font-bold uppercase tracking-widest text-cyan-100 sm:text-3xl"
            style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
          >
            Câmara de Sessão
          </h1>
          <p className="text-sm text-zinc-400">
            Escolha um monstro e uma planta na bancada. O bicho vai fazer sessão e virar carta jogável.
          </p>
        </header>

        {vessels.length === 0 && (
          <p className="rounded-2xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            Você não tem vessels não usados. Resgate um código ou compre uma lootbox para obter vessels.
          </p>
        )}
        {strains.length === 0 && vessels.length > 0 && (
          <p className="rounded-2xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            Você não tem strains não usados. Resgate um código ou compre uma lootbox para obter strains.
          </p>
        )}
        <FusionLab vessels={vessels} strains={strains} />
      </div>
    </main>
  );
}
