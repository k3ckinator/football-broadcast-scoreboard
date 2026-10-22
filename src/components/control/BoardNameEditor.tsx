"use client";

import { useEffect, useState } from "react";

type BoardNameEditorProps = {
  boardId: string;
  initialName: string;
  variant?: "inline" | "header";
  onRenamed?: (name: string) => void;
};

export function BoardNameEditor({
  boardId,
  initialName,
  variant = "inline",
  onRenamed,
}: BoardNameEditorProps) {
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    setDraft(initialName);
  }, [initialName]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft }),
      });
      if (!res.ok) {
        setError("Speichern fehlgeschlagen.");
        return;
      }
      const data = (await res.json()) as { board: { name: string } };
      setName(data.board.name);
      setDraft(data.board.name);
      setEditing(false);
      onRenamed?.(data.board.name);
    } finally {
      setSaving(false);
    }
  };

  if (variant === "header") {
    return (
      <div>
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-lg font-black text-white"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={80}
              autoFocus
            />
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
              onClick={() => void save()}
            >
              Speichern
            </button>
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300"
              onClick={() => {
                setDraft(name);
                setEditing(false);
                setError(null);
              }}
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="text-left text-2xl font-black tracking-tight text-white hover:text-emerald-300"
            onClick={() => setEditing(true)}
            title="Name bearbeiten"
          >
            {name}
          </button>
        )}
        <p className="text-sm text-zinc-400">
          ID <span className="font-mono text-zinc-500">{boardId}</span>
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={80}
            autoFocus
          />
          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
            onClick={() => void save()}
          >
            OK
          </button>
          <button
            type="button"
            className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300"
            onClick={() => {
              setDraft(name);
              setEditing(false);
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="font-bold text-white hover:underline"
          onClick={() => setEditing(true)}
        >
          {name}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
