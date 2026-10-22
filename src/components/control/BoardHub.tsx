"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BoardNameEditor } from "./BoardNameEditor";
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
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        body: JSON.stringify({
          name: newName.trim() || "Neues Scoreboard",
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { board: BoardSummary };
      setNewName("");
      router.push(`/control/${data.board.id}`);
    } finally {
      setCreating(false);
    }
  };

  const deleteBoard = async (boardId: string, boardName: string) => {
    const ok = window.confirm(
      `Scoreboard „${boardName}" wirklich löschen? Der Overlay-Link funktioniert danach nicht mehr.`,
    );
    if (!ok) return;
    setDeletingId(boardId);
    try {
      const res = await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
      if (res.ok) {
        setBoards((prev) => prev.filter((b) => b.id !== boardId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const onRenamed = (boardId: string, name: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, name } : b)),
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-2xl font-black text-white">Meine Scoreboards</h1>
            <p className="text-sm text-zinc-400">
              Namen vergeben, bearbeiten oder Boards entfernen.
            </p>
          </div>
          <ControlAuthMenu />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <label className="block text-sm text-zinc-400">
            Name für neues Scoreboard
            <input
              className="mt-2 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-4 py-3 text-white"
              placeholder="z. B. BOMTEC Home Game"
              value={newName}
              maxLength={80}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={creating}
            className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
            onClick={() => void createBoard()}
          >
            {creating ? "Erstelle…" : "+ Scoreboard anlegen"}
          </button>
        </div>

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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <BoardNameEditor
                      boardId={board.id}
                      initialName={board.name}
                      onRenamed={(name) => onRenamed(board.id, name)}
                    />
                    <p className="mt-1 font-mono text-xs text-zinc-500">
                      {board.id}
                    </p>
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
                    <button
                      type="button"
                      disabled={deletingId === board.id}
                      className="rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-900 disabled:opacity-50"
                      onClick={() => void deleteBoard(board.id, board.name)}
                    >
                      Löschen
                    </button>
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
