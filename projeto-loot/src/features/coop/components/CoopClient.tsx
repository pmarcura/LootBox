"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createCoopLobby,
  joinCoopLobby,
  leaveCoopLobby,
  fillCoopLobbyWithBot,
  startCoopRun,
  getCoopLobby,
  type CoopLobby,
} from "../actions/lobby";

type CoopClientProps = {
  userId: string | null;
  initialLobbyId: string | null;
  initialLobby: CoopLobby | null;
};

export function CoopClient({
  userId,
  initialLobbyId,
  initialLobby,
}: CoopClientProps) {
  const [lobbyId, setLobbyId] = React.useState<string | null>(initialLobbyId);
  const [lobby, setLobby] = React.useState<CoopLobby | null>(initialLobby);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copyDone, setCopyDone] = React.useState(false);

  const isHost = userId && lobby?.host_user_id === userId;
  const canStart =
    lobby?.status === "waiting" &&
    (lobby.guest_user_id != null || lobby.filled_with_bot);

  const refreshLobby = React.useCallback(async () => {
    if (!lobbyId) return;
    const l = await getCoopLobby(lobbyId);
    setLobby(l);
  }, [lobbyId]);

  React.useEffect(() => {
    if (!lobbyId) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`coop_lobby:${lobbyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "coop_lobbies",
          filter: `id=eq.${lobbyId}`,
        },
        () => {
          void getCoopLobby(lobbyId).then((l) => {
            setLobby(l);
            if (l?.status === "draft") {
              window.location.href = `/coop/draft?lobby=${lobbyId}`;
            }
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [lobbyId]);

  const handleCreate = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const result = await createCoopLobby();
    setLoading(false);
    if (result.ok) {
      setLobbyId(result.lobbyId);
      const l = await getCoopLobby(result.lobbyId);
      setLobby(l);
      window.history.replaceState(null, "", `/coop?lobby=${result.lobbyId}`);
    } else {
      setError(result.error);
    }
  };

  const handleJoin = async () => {
    if (!userId) return;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Digite o código do lobby.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await joinCoopLobby(trimmed);
    setLoading(false);
    if (result.ok) {
      setLobbyId(result.lobbyId);
      const l = await getCoopLobby(result.lobbyId);
      setLobby(l);
      window.history.replaceState(null, "", `/coop?lobby=${result.lobbyId}`);
    } else {
      setError(result.error);
    }
  };

  const handleLeave = async () => {
    if (!lobbyId) return;
    setLoading(true);
    await leaveCoopLobby(lobbyId);
    setLoading(false);
    setLobbyId(null);
    setLobby(null);
    window.history.replaceState(null, "", "/coop");
  };

  const handleFillBot = async () => {
    if (!lobbyId) return;
    setLoading(true);
    setError(null);
    const result = await fillCoopLobbyWithBot(lobbyId);
    setLoading(false);
    if (result.ok) await refreshLobby();
    else setError(result.error);
  };

  const handleStart = async () => {
    if (!lobbyId) return;
    setLoading(true);
    setError(null);
    const result = await startCoopRun(lobbyId);
    setLoading(false);
    if (result.ok) {
      await refreshLobby();
      window.location.href = `/coop/draft?lobby=${lobbyId}`;
    } else {
      setError(result.error);
    }
  };

  const copyLink = () => {
    if (typeof window === "undefined" || !lobbyId) return;
    const url = `${window.location.origin}/coop?lobby=${lobbyId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  if (!userId) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-zinc-400">Faça login para jogar no modo coop.</p>
        <Button variant="primary" className="mt-4" asChild>
          <Link href="/login?redirect=/coop">Entrar</Link>
        </Button>
      </div>
    );
  }

  if (lobbyId && lobby) {
    return (
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">Lobby</h2>
          <p className="mb-2 text-sm text-zinc-400">Código para compartilhar</p>
          <div className="mb-4 flex items-center gap-2">
            <code className="rounded-lg bg-zinc-800 px-4 py-2 text-xl font-mono text-amber-400">
              {lobby.code}
            </code>
            <Button variant="secondary" size="sm" onClick={copyLink}>
              {copyDone ? "Copiado!" : "Copiar link"}
            </Button>
          </div>
          <ul className="mb-4 space-y-2 text-sm text-zinc-300">
            <li>Jogador 1 (host): {isHost ? "Você" : "Host"}</li>
            <li>
              Jogador 2:{" "}
              {lobby.filled_with_bot
                ? "Bot"
                : lobby.guest_user_id
                  ? lobby.guest_user_id === userId
                    ? "Você"
                    : "Conectado"
                  : "Aguardando..."}
            </li>
          </ul>
          {error && (
            <p className="mb-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {isHost && lobby.status === "waiting" && (
              <>
                {!lobby.filled_with_bot && !lobby.guest_user_id && (
                  <Button
                    variant="secondary"
                    onClick={handleFillBot}
                    disabled={loading}
                  >
                    Preencher com bot
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={loading || !canStart}
                >
                  Iniciar run
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={handleLeave} disabled={loading}>
              Sair
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          Modo Coop 2v1 (Boss)
        </h2>
        <p className="mb-6 text-sm text-zinc-400">
          Crie um lobby e convide um amigo, ou preencha com bot. Vocês enfrentam
          waves de inimigos até o boss e escolhem buffs entre as vitórias.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={handleCreate} disabled={loading}>
            Criar lobby
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          Entrar com código
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="Código do lobby (ex: A1B2C3)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="max-w-[12rem] font-mono uppercase"
            maxLength={8}
          />
          <Button variant="secondary" onClick={handleJoin} disabled={loading}>
            Entrar
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
