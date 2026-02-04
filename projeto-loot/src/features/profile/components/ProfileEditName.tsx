"use client";

import * as React from "react";
import { updateDisplayName } from "../actions";

type Props = {
  currentName: string;
};

export function ProfileEditName({ currentName }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(currentName);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setName(currentName);
  }, [currentName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await updateDisplayName(name);
    setPending(false);
    if (result.ok) {
      setEditing(false);
    } else {
      setError(result.error);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 underline"
      >
        Alterar nome
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome"
        maxLength={64}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setName(currentName);
            setError(null);
          }}
          disabled={pending}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
