"use client";

import dynamic from "next/dynamic";

const DuelsPanel = dynamic(
  () => import("./DuelsPanel").then((m) => ({ default: m.DuelsPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
      </div>
    ),
  },
);

type ProfileInfo = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type MatchItem = {
  id: string;
  player1_id: string;
  player2_id: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  opponentProfile?: ProfileInfo | null;
};

type PendingInviteItem = {
  id: string;
  player1_id: string;
  player2_id: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  challengerProfile?: ProfileInfo | null;
};

type FriendItem = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
};

type DeckCard = {
  id: string;
  final_hp: number;
  final_atk: number;
  mana_cost: number;
  keyword: string;
};

export type DuelsPanelDynamicProps = {
  activeMatches: MatchItem[];
  pendingInvites: PendingInviteItem[];
  friends: FriendItem[];
  initialDeckCards?: DeckCard[];
};

export function DuelsPanelDynamic(props: DuelsPanelDynamicProps) {
  return <DuelsPanel {...props} />;
}
