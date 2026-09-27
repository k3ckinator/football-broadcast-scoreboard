"use client";

import { useRef, useState } from "react";
import { nanoid } from "nanoid";
import { defaultScoreboardState } from "@/lib/defaults";
import { emitReplace } from "@/lib/socket-client";
import type { GamePreset, ScoreboardState } from "@/lib/types/scoreboard";
import { useScoreboardStore } from "@/store/useScoreboardStore";

const STORAGE_KEY = "fb-scoreboard-presets";

function loadPresets(): GamePreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GamePreset[]) : [];
  } catch {
    return [];
  }
}

function savePresets(list: GamePreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function PresetControls() {
  const state = useScoreboardStore((s) => s.state);
  const [presets, setPresets] = useState<GamePreset[]>(() => loadPresets());
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setPresets(loadPresets());

  const saveCurrent = () => {
    const preset: GamePreset = {
      id: nanoid(),
      name: name.trim() || `Game ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      state: structuredClone(state),
    };
    const next = [preset, ...presets];
    savePresets(next);
    setPresets(next);
    setName("");
  };

  const loadPreset = (p: GamePreset) => {
    emitReplace(p.state);
  };

  const deletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    savePresets(next);
    setPresets(next);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `scoreboard-${Date.now()}.json`;
    a.click();
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as ScoreboardState;
        if (parsed.version === 1) emitReplace(parsed);
      } catch {
        alert("Invalid JSON preset file.");
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    if (confirm("Reset entire scoreboard to defaults?")) {
      emitReplace(defaultScoreboardState());
    }
  };

  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
      <h2 className="mb-4 text-lg font-bold text-white">Presets & backup</h2>

      <div className="flex flex-wrap gap-2">
        <input
          className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-white"
          placeholder="Preset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className="rounded bg-blue-700 px-4 py-2 font-bold text-white"
          onClick={saveCurrent}
        >
          Save preset
        </button>
        <button
          type="button"
          className="rounded bg-zinc-700 px-4 py-2 text-white"
          onClick={exportJson}
        >
          Export JSON
        </button>
        <button
          type="button"
          className="rounded bg-zinc-700 px-4 py-2 text-white"
          onClick={() => fileRef.current?.click()}
        >
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
          }}
        />
        <button
          type="button"
          className="rounded bg-red-900 px-4 py-2 text-white"
          onClick={reset}
        >
          Reset defaults
        </button>
        <button
          type="button"
          className="rounded bg-zinc-800 px-3 py-2 text-xs text-zinc-300"
          onClick={refresh}
        >
          Refresh list
        </button>
      </div>

      <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto">
        {presets.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm"
          >
            <span className="text-zinc-200">
              {p.name}{" "}
              <span className="text-zinc-500">
                ({new Date(p.createdAt).toLocaleDateString()})
              </span>
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={() => loadPreset(p)}
              >
                Load
              </button>
              <button
                type="button"
                className="text-red-400 hover:underline"
                onClick={() => deletePreset(p.id)}
              >
                Delete
              </button>
            </span>
          </li>
        ))}
        {presets.length === 0 && (
          <li className="text-sm text-zinc-500">No saved presets yet.</li>
        )}
      </ul>
    </section>
  );
}
