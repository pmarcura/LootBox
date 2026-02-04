import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin | Projeto Gênesis",
  description: "Painel administrativo: catálogo de vessels, strains e configurações.",
};
import {
  createCollectibleAction,
  deleteCollectibleAction,
  updateCollectibleAction,
} from "@/features/admin/actions/catalog";
import {
  createStrainAction,
  deleteStrainAction,
  updateStrainAction,
} from "@/features/admin/actions/strains";
import { requireAdmin } from "@/features/admin/utils";
import type { Rarity } from "@/features/gacha/types";

type CollectibleRow = {
  id: string;
  slug: string;
  name: string;
  rarity: Rarity;
  series: string | null;
  model_key: string | null;
  base_hp: number;
  base_atk: number;
  base_mana: number;
};

type StrainRow = {
  id: string;
  slug: string;
  name: string;
  rarity: Rarity;
  family: string;
  image_url: string | null;
};

type InventoryRow = {
  id: string;
  user_id: string;
  acquired_at: string;
  collectible:
    | {
        name: string;
        rarity: Rarity;
        slug: string;
      }
    | {
        name: string;
        rarity: Rarity;
        slug: string;
      }[]
    | null;
};

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const admin = createSupabaseAdminClient();

  const [{ data: catalog }, { data: strains }, { data: codes }, { data: inventory }] =
    await Promise.all([
      supabase
        .from("collectibles_catalog")
        .select("id, slug, name, rarity, series, model_key, base_hp, base_atk, base_mana")
        .order("rarity", { ascending: true }),
      supabase
        .from("strains_catalog")
        .select("id, slug, name, rarity, family, image_url")
        .order("family", { ascending: true })
        .order("rarity", { ascending: true }),
      supabase.from("redemption_codes").select("batch_id, redeemed_at"),
      supabase
        .from("user_inventory")
        .select(
          "id, user_id, acquired_at, collectible:collectibles_catalog(name, rarity, slug)",
        )
        .order("acquired_at", { ascending: false })
        .limit(50),
    ]);

  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 50,
  });

  const catalogRows = (catalog ?? []) as CollectibleRow[];
  const strainRows = (strains ?? []) as StrainRow[];
  const inventoryRows = (inventory ?? []) as InventoryRow[];
  const codeStats = new Map<
    string,
    { total: number; redeemed: number }
  >();

  for (const row of codes ?? []) {
    const batchId = row.batch_id ?? "sem-batch";
    const current = codeStats.get(batchId) ?? { total: 0, redeemed: 0 };
    current.total += 1;
    if (row.redeemed_at) {
      current.redeemed += 1;
    }
    codeStats.set(batchId, current);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          Operações
        </p>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Painel Administrativo
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Gestão de catálogo, códigos e usuários em tempo real.
        </p>
      </section>

      <section
        id="catalogo"
        className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Catálogo
        </h3>
        <form
          action={createCollectibleAction}
          className="mt-4 grid gap-3 md:grid-cols-8"
        >
          <Input name="name" placeholder="Nome" required />
          <Input name="slug" placeholder="Slug" required />
          <Input name="series" placeholder="Série/galáxia" />
          <Input name="model_key" placeholder="Model key" />
          <Input name="base_hp" type="number" min={0} placeholder="HP" defaultValue={0} />
          <Input name="base_atk" type="number" min={0} placeholder="ATK" defaultValue={0} />
          <Input name="base_mana" type="number" min={0} placeholder="Mana" defaultValue={0} />
          <select
            name="rarity"
            className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            required
          >
            <option value="common">common</option>
            <option value="uncommon">uncommon</option>
            <option value="rare">rare</option>
            <option value="epic">epic</option>
            <option value="legendary">legendary</option>
          </select>
          <Button type="submit" className="md:col-span-2">Adicionar vessel</Button>
        </form>

        <div className="mt-6 space-y-3">
          {catalogRows.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <form
                action={updateCollectibleAction}
                className="grid gap-3 md:grid-cols-8"
              >
                <input type="hidden" name="id" value={item.id} />
                <Input name="name" defaultValue={item.name} required />
                <Input name="slug" defaultValue={item.slug} required />
                <Input
                  name="series"
                  defaultValue={item.series ?? ""}
                  placeholder="Série/galáxia"
                />
                <Input
                  name="model_key"
                  defaultValue={item.model_key ?? ""}
                  placeholder="Model key"
                />
                <Input name="base_hp" type="number" min={0} defaultValue={item.base_hp ?? 0} />
                <Input name="base_atk" type="number" min={0} defaultValue={item.base_atk ?? 0} />
                <Input name="base_mana" type="number" min={0} defaultValue={item.base_mana ?? 0} />
                <select
                  name="rarity"
                  defaultValue={item.rarity}
                  className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  required
                >
                  <option value="common">common</option>
                  <option value="uncommon">uncommon</option>
                  <option value="rare">rare</option>
                  <option value="epic">epic</option>
                  <option value="legendary">legendary</option>
                </select>
                <Button type="submit" variant="secondary">
                  Salvar
                </Button>
              </form>
              <div className="mt-3 flex items-center gap-3">
                <Badge tone={item.rarity}>{item.rarity}</Badge>
                <span className="text-xs text-zinc-500">
                  HP {item.base_hp ?? 0} / ATK {item.base_atk ?? 0} / Mana {item.base_mana ?? 0}
                </span>
                <span className="text-xs text-zinc-500">
                  {item.series === "season01" ? "Season 01" : (item.series ?? "sem série")}
                </span>
                <form action={deleteCollectibleAction} className="ml-auto">
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="ghost">
                    Excluir
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="strains"
        className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Strains (catálogo)
        </h3>
        <form
          action={createStrainAction}
          className="mt-4 grid gap-3 md:grid-cols-6"
        >
          <Input name="name" placeholder="Nome" required />
          <Input name="slug" placeholder="Slug" required />
          <select
            name="rarity"
            className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            required
          >
            <option value="common">common</option>
            <option value="uncommon">uncommon</option>
            <option value="rare">rare</option>
            <option value="epic">epic</option>
            <option value="legendary">legendary</option>
          </select>
          <select
            name="family"
            className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            required
          >
            <option value="NEURO">NEURO</option>
            <option value="SHELL">SHELL</option>
            <option value="PSYCHO">PSYCHO</option>
          </select>
          <Input name="image_url" placeholder="Image URL" />
          <Button type="submit">Adicionar strain</Button>
        </form>
        <div className="mt-6 space-y-3">
          {strainRows.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <form
                action={updateStrainAction}
                className="grid gap-3 md:grid-cols-6"
              >
                <input type="hidden" name="id" value={item.id} />
                <Input name="name" defaultValue={item.name} required />
                <Input name="slug" defaultValue={item.slug} required />
                <select
                  name="rarity"
                  defaultValue={item.rarity}
                  className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  required
                >
                  <option value="common">common</option>
                  <option value="uncommon">uncommon</option>
                  <option value="rare">rare</option>
                  <option value="epic">epic</option>
                  <option value="legendary">legendary</option>
                </select>
                <select
                  name="family"
                  defaultValue={item.family}
                  className="h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  required
                >
                  <option value="NEURO">NEURO</option>
                  <option value="SHELL">SHELL</option>
                  <option value="PSYCHO">PSYCHO</option>
                </select>
                <Input name="image_url" defaultValue={item.image_url ?? ""} placeholder="Image URL" />
                <Button type="submit" variant="secondary">
                  Salvar
                </Button>
              </form>
              <div className="mt-3 flex items-center gap-3">
                <Badge tone={item.rarity}>{item.rarity}</Badge>
                <span className="text-xs text-zinc-500">{item.family}</span>
                <form action={deleteStrainAction} className="ml-auto">
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="ghost">
                    Excluir
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="codigos"
        className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Códigos
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[...codeStats.entries()].map(([batch, stats]) => (
            <div
              key={batch}
              className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                {batch}
              </p>
              <p className="mt-2 text-zinc-900 dark:text-zinc-50">
                Total: {stats.total}
              </p>
              <p className="text-zinc-500">Resgatados: {stats.redeemed}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="usuarios"
        className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Usuários & Inventário
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Usuários (últimos 50)
            </p>
            <ul className="mt-3 space-y-2 text-xs text-zinc-500">
              {usersData?.users.map((user) => (
                <li key={user.id}>
                  {user.email ?? "sem email"} — {user.id}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Inventário (últimos 50)
            </p>
            <ul className="mt-3 space-y-2 text-xs text-zinc-500">
              {inventoryRows.map((row) => {
                const collectible = Array.isArray(row.collectible)
                  ? row.collectible[0]
                  : row.collectible;
                return (
                  <li key={row.id}>
                    {collectible?.name ?? "Item desconhecido"} —{" "}
                    {collectible?.rarity ?? "n/a"} — {row.user_id}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
