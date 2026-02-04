"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CombatBoardHybrid } from "@/features/playground/components/CombatBoardHybrid";
import { createMatchForWave, WAVES } from "@/features/playground/lib/run-state";
import { pickRandomBuffs } from "@/features/playground/lib/run-buffs";
import type { RunState, RunBuff } from "@/features/playground/lib/run-state";
import { useBattleStore } from "@/features/playground/stores/battleStore";
import { loadRunStateFromStorage } from "./CoopDraftClient";
import { RewardScreen } from "./RewardScreen";

export function CoopRunClient() {
  const router = useRouter();
  const [runState, setRunState] = React.useState<RunState | null>(null);
  const [phase, setPhase] = React.useState<"loading" | "playing" | "reward" | "gameover" | "victory">("loading");
  const [rewardOptions, setRewardOptions] = React.useState<RunBuff[]>([]);

  const matchState = useBattleStore((s) => s.matchState);
  const initMatch = useBattleStore((s) => s.initMatch);
  const setRunStateStore = useBattleStore((s) => s.setRunState);
  const reset = useBattleStore((s) => s.reset);

  // Load run from storage and start first wave
  React.useEffect(() => {
    const loaded = loadRunStateFromStorage();
    if (!loaded) {
      router.replace("/coop");
      return;
    }
    setRunState(loaded);
    setRunStateStore(loaded);
    const { matchState: initialMatch, wave } = createMatchForWave(loaded, loaded.waveIndex);
    initMatch(initialMatch, initialMatch.config, "coop", 0);
    setPhase("playing");
  }, [router, initMatch, setRunStateStore]);

  // When match finishes, transition to reward or game over (useLayoutEffect to avoid flashing board "Continuar")
  React.useLayoutEffect(() => {
    if (phase !== "playing" || !runState || !matchState) return;
    if (matchState.status !== "finished") return;

    const won = matchState.winner === "player1";
    const waveIndex = runState.waveIndex;
    const isBoss = waveIndex === WAVES.length - 1;

    if (won && isBoss) {
      setPhase("victory");
      return;
    }
    if (won) {
      const options = pickRandomBuffs(waveIndex, runState);
      if (options.length > 0) {
        setRewardOptions(options);
        setPhase("reward");
      } else {
        const nextRun: RunState = {
          ...runState,
          waveIndex: runState.waveIndex + 1,
          allyLife: matchState.player1Life,
        };
        setRunState(nextRun);
        setRunStateStore(nextRun);
        const { matchState: nextMatch } = createMatchForWave(nextRun, nextRun.waveIndex);
        initMatch(nextMatch, nextMatch.config, "coop", 0);
      }
      return;
    }
    setPhase("gameover");
  }, [phase, runState, matchState, setRunStateStore, initMatch]);

  const handlePickReward = React.useCallback(
    (buff: RunBuff) => {
      if (!runState || !matchState) return;
      const nextRun: RunState = {
        ...runState,
        waveIndex: runState.waveIndex + 1,
        collectedBuffs: [...runState.collectedBuffs, buff],
        allyLife: matchState.player1Life,
      };
      setRunState(nextRun);
      setRunStateStore(nextRun);
      const { matchState: nextMatch } = createMatchForWave(nextRun, nextRun.waveIndex);
      initMatch(nextMatch, nextMatch.config, "coop", 0);
      setPhase("playing");
    },
    [runState, matchState, initMatch, setRunStateStore]
  );

  const handleBack = React.useCallback(() => {
    reset();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("coop_run_state");
    }
    router.push("/coop");
  }, [reset, router]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-zinc-400">Carregando run...</p>
      </div>
    );
  }

  if (phase === "reward" && rewardOptions.length > 0) {
    return <RewardScreen options={rewardOptions} onPick={handlePickReward} />;
  }

  if (phase === "gameover") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4">
        <h2 className="text-2xl font-bold text-zinc-100">Fim da run</h2>
        <p className="text-zinc-400">Vocês foram derrotados.</p>
        <Button variant="primary" asChild>
          <Link href="/coop">Voltar ao menu Coop</Link>
        </Button>
      </div>
    );
  }

  if (phase === "victory") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4">
        <h2 className="text-2xl font-bold text-amber-400">Vitória da run!</h2>
        <p className="text-zinc-400">Boss derrotado.</p>
        <Button variant="primary" asChild>
          <Link href="/coop">Voltar ao menu Coop</Link>
        </Button>
      </div>
    );
  }

  const wave = runState ? WAVES[runState.waveIndex] : null;
  return (
    <div className="relative flex flex-col">
      {wave && runState && (
        <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 text-center backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Wave {runState.waveIndex + 1} — {wave.label}
          </p>
        </div>
      )}
      <CombatBoardHybrid onBack={handleBack} />
    </div>
  );
}
