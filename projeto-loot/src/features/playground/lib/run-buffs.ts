/**
 * Coop run buffs: definitions and random pick for reward screen.
 */

import type { RunBuff, RunBuffRarity, RunState } from "./run-state";

export type BuffId =
  | "reserve_nutrient"
  | "sturdy_start"
  | "bark_armor"
  | "nimble_strike"
  | "adjacent_share_atk"
  | "heal_gives_ally_atk"
  | "spores_on_death"
  | "mana_surge"
  | "keyword_global_2rounds"
  | "symphony_of_roots"
  | "overgrowth"
  | "nexus_shield";

const BUFF_LIST: (RunBuff & { id: BuffId })[] = [
  {
    id: "reserve_nutrient",
    rarity: "common",
    name: "Nutriente de Reserva",
    description:
      "No início de cada rodada, você e seu aliado ganham +1 de mana (além do normal).",
  },
  {
    id: "sturdy_start",
    rarity: "common",
    name: "Casca Grossa",
    description: "Unidades que você jogar ganham +1 de Vida ao entrar no campo.",
  },
  {
    id: "bark_armor",
    rarity: "common",
    name: "Casca Rígida",
    description: "Unidades no campo ganham +1 de Vida (máx. 1 vez por carta).",
  },
  {
    id: "nimble_strike",
    rarity: "common",
    name: "Golpe Rápido",
    description: "Unidades que você jogar ganham +1 de Ataque ao entrar no campo.",
  },
  {
    id: "adjacent_share_atk",
    rarity: "rare",
    name: "Raízes Conectadas",
    description:
      "Unidades adjacentes (mesmo de jogadores diferentes) compartilham 20% do seu Ataque.",
  },
  {
    id: "heal_gives_ally_atk",
    rarity: "epic",
    name: "Sintonia Verde",
    description:
      "Sempre que o Jogador 1 cura o Nexus, o Jogador 2 ganha +1 de Ataque na unidade mais forte.",
  },
  {
    id: "spores_on_death",
    rarity: "rare",
    name: "Esporos",
    description:
      "Ao morrer, sua unidade libera esporos: +2 de Vida para a unidade aliada adjacente.",
  },
  {
    id: "mana_surge",
    rarity: "rare",
    name: "Surto de Mana",
    description: "No início da rodada 3+, ganhe +1 mana extra (além do normal).",
  },
  {
    id: "keyword_global_2rounds",
    rarity: "epic",
    name: "Surto Cromático",
    description:
      "Escolha uma keyword (VAMPIRISM, OVERCLOCK, BLOCKER). Todas as unidades de ambos os jogadores ganham ela por 2 rodadas.",
  },
  {
    id: "symphony_of_roots",
    rarity: "epic",
    name: "Sinfonia das Raízes",
    description:
      "Unidades adjacentes compartilham 30% do Ataque e ganham +1 de Vida quando uma aliada morre.",
  },
  {
    id: "overgrowth",
    rarity: "legendary",
    name: "Crescimento Excessivo",
    description:
      "No início de cada rodada: +1 mana e todas as suas unidades ganham +1/+1.",
  },
  {
    id: "nexus_shield",
    rarity: "legendary",
    name: "Escudo do Nexus",
    description:
      "Seu Nexus ganha 5 de Vida máxima. Cura 2 no início de cada rodada.",
  },
];

export function getBuffById(id: string): RunBuff | undefined {
  return BUFF_LIST.find((b) => b.id === id);
}

/**
 * Pick 3 random buffs for the reward screen. Already collected buffs are excluded.
 * Balanceamento: waves 0–1 (comum+1 raro), wave 2 (comum/raros), waves 3+ (inclui épico),
 * boss (wave 4) tem chance de lendário.
 */
export function pickRandomBuffs(
  waveIndex: number,
  runState: RunState,
): RunBuff[] {
  const collectedIds = new Set(runState.collectedBuffs.map((b) => b.id));
  const available = BUFF_LIST.filter((b) => !collectedIds.has(b.id));
  if (available.length === 0) return [];
  if (available.length <= 3) return shuffle([...available]).slice(0, 3);

  const common = available.filter((b) => b.rarity === "common");
  const rare = available.filter((b) => b.rarity === "rare");
  const epic = available.filter((b) => b.rarity === "epic");
  const legendary = available.filter((b) => b.rarity === "legendary");

  const pickOne = (pool: (RunBuff & { id: BuffId })[]): RunBuff | null =>
    pool.length > 0 ? shuffle([...pool])[0]! : null;
  const pickDistinct = (pool: (RunBuff & { id: BuffId })[], exclude: Set<string>): RunBuff | null =>
    pickOne(pool.filter((b) => !exclude.has(b.id)));

  const chosen: RunBuff[] = [];
  const used = new Set<string>();

  if (waveIndex <= 1) {
    // Waves 1–2: 2 comuns + 1 raro (ou 2 comuns se não tiver raro)
    if (common.length >= 2) {
      const c1 = pickOne(common);
      if (c1) { chosen.push(c1); used.add(c1.id); }
      const c2 = pickDistinct(common, used);
      if (c2) { chosen.push(c2); used.add(c2.id); }
    } else if (common.length === 1) {
      chosen.push(common[0]!);
      used.add(common[0]!.id);
    }
    if (rare.length > 0 && chosen.length < 3) {
      const r = pickDistinct(rare, used);
      if (r) { chosen.push(r); used.add(r.id); }
    }
  } else if (waveIndex === 2) {
    // Wave 3: 1 comum + 1 raro + 1 épico (ou fill com o que tiver)
    if (common.length > 0) {
      const c = pickDistinct(common, used);
      if (c) { chosen.push(c); used.add(c.id); }
    }
    if (rare.length > 0) {
      const r = pickDistinct(rare, used);
      if (r) { chosen.push(r); used.add(r.id); }
    }
    if (epic.length > 0) {
      const e = pickDistinct(epic, used);
      if (e) { chosen.push(e); used.add(e.id); }
    }
  } else {
    // Wave 4 e Boss: mix com chance de lendário (boss = wave 4)
    const isBoss = waveIndex === 4;
    const legendaryChance = isBoss ? 0.5 : 0.25;
    if (legendary.length > 0 && Math.random() < legendaryChance) {
      const l = pickOne(legendary);
      if (l) { chosen.push(l); used.add(l.id); }
    }
    if (epic.length > 0 && chosen.length < 3) {
      const e = pickDistinct(epic, used);
      if (e) { chosen.push(e); used.add(e.id); }
    }
    if (rare.length > 0 && chosen.length < 3) {
      const r = pickDistinct(rare, used);
      if (r) { chosen.push(r); used.add(r.id); }
    }
    if (common.length > 0 && chosen.length < 3) {
      const c = pickDistinct(common, used);
      if (c) { chosen.push(c); used.add(c.id); }
    }
  }

  while (chosen.length < 3) {
    const rest = available.filter((b) => !used.has(b.id));
    if (rest.length === 0) break;
    const next = pickOne(rest);
    if (!next) break;
    chosen.push(next);
    used.add(next.id);
  }

  return shuffle(chosen).slice(0, 3);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export { BUFF_LIST };
