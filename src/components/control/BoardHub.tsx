"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ControlAuthMenu } from "./ControlAuthMenu";

type BoardSummary = {
  id: string;
  name: string;
  updatedAt: number;
};

export function BoardHub() {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadBoards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/boards");
      const data = (await res.json()) as { boards?: BoardSummary[] };
      setBoards(data.boards ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  const createBoard = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Neues Scoreboard" }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { board: BoardSummary };
      router.push(`/control/${data.board.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-2xl font-black text-white">Meine Scoreboards</h1>
            <p className="text-sm text-zinc-400">
              Jedes Board hat einen eigenen Overlay-Link für OBS.
            </p>
          </div>
          <ControlAuthMenu />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <button
          type="button"
          disabled={creating}
          className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
          onClick={() => void createBoard()}
        >
          {creating ? "Erstelle…" : "+ Neues Scoreboard"}
        </button>

        {loading ? (
          <p className="text-zinc-500">Lade…</p>
        ) : boards.length === 0 ? (
          <p className="text-zinc-500">Noch keine Scoreboards.</p>
        ) : (
          <ul className="space-y-3">
            {boards.map((board) => (
              <li
                key={board.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{board.name}</p>
                    <p className="font-mono text-xs text-zinc-500">{board.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/control/${board.id}`}
                      className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                    >
                      Steuern
                    </Link>
                    <Link
                      href={`/overlay/${board.id}`}
                      target="_blank"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                      Overlay
                    </Link>
                  </div>
                </div>
                <p className="mt-2 break-all text-xs text-emerald-400/90">
                  OBS: /overlay/{board.id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
