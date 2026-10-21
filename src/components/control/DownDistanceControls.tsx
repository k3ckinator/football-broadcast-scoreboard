"use client";

import { emitPatch } from "@/lib/socket-client";
import { formatDownDistance, resolveDownDistance } from "@/lib/down-distance";
import type { DistanceKind, DownNumber } from "@/lib/types/scoreboard";
import { useScoreboardStore } from "@/store/useScoreboardStore";

const DOWNS: DownNumber[] = [1, 2, 3, 4];
const DOWN_LABELS = ["1st", "2nd", "3rd", "4th"];

const YARD_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20];

const SPECIAL_DISTANCE: { kind: DistanceKind; label: string }[] = [
  { kind: "goal", label: "Goal" },
  { kind: "long", label: "Long" },
  { kind: "inches", label: "Inches" },
];

export function DownDistanceControls() {
  const state = useScoreboardStore((s) => s.state);
  const parts = resolveDownDistance(state);

  const setDown = (down: DownNumber) => emitPatch({ downNumber: down });
  const setYards = (yards: number) =>
    emitPatch({ yardsToGo: yards, distanceKind: "yards" });
  const setDistanceKind = (distanceKind: DistanceKind) =>
    emitPatch({ distanceKind });

  const bumpYards = (delta: number) => {
    const base = parts.distanceKind === "yards" ? parts.yardsToGo : 10;
    emitPatch({
      yardsToGo: Math.max(1, Math.min(99, base + delta)),
      distanceKind: "yards",
    });
  };

  const setFirstAndTen = () =>
    emitPatch({ downNumber: 1, yardsToGo: 10, distanceKind: "yards" });

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
          Down &amp; Distance
        </span>
        <span className="rounded bg-zinc-800 px-3 py-1 font-mono text-sm font-black text-emerald-300">
          {formatDownDistance(parts)}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs text-zinc-500">Down</p>
          <div className="grid grid-cols-4 gap-2">
            {DOWNS.map((d, i) => (
              <button
                key={d}
                type="button"
                className={`rounded-lg py-3 text-sm font-black uppercase ${
                  parts.down === d
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
                onClick={() => setDown(d)}
              >
                {DOWN_LABELS[i]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded-lg bg-blue-950 py-2.5 text-sm font-bold text-blue-200 ring-1 ring-blue-800 hover:bg-blue-900"
            onClick={setFirstAndTen}
          >
            Neues First Down
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs text-zinc-500">Yards / Situation</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {SPECIAL_DISTANCE.map((s) => (
              <button
                key={s.kind}
                type="button"
                className={`min-w-[72px] flex-1 rounded-lg py-2 text-sm font-bold ${
                  parts.distanceKind === s.kind
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
                onClick={() => setDistanceKind(s.kind)}
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-bold text-white"
              onClick={() => bumpYards(-1)}
            >
              −1
            </button>
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-bold text-white"
              onClick={() => bumpYards(1)}
            >
              +1
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
            {YARD_PRESETS.map((y) => (
              <button
                key={y}
                type="button"
                className={`rounded py-2 text-xs font-bold ${
                  parts.distanceKind === "yards" && parts.yardsToGo === y
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                }`}
                onClick={() => setYards(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
