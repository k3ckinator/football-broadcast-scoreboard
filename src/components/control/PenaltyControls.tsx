"use client";

import {
  emitClearPenalty,
  emitTriggerGenericFlag,
  emitTriggerPenalty,
} from "@/lib/socket-client";
import type { PenaltyPreset } from "@/lib/types/scoreboard";
import { useScoreboardStore } from "@/store/useScoreboardStore";
import { useState } from "react";

const PRESETS: PenaltyPreset[] = [
  "Holding",
  "False Start",
  "Offside",
  "Personal Foul",
  "Pass Interference",
  "Unsportsmanlike Conduct",
  "Illegal Formation",
  "Delay of Game",

];

export function PenaltyControls() {
  const state = useScoreboardStore((s) => s.state);
  const [custom, setCustom] = useState("");

  const throwFlag = (text: string, preset: PenaltyPreset = "custom") => {
    const teamId = state.possession === "away" ? "home" : "away";
    emitTriggerPenalty({
      teamId: teamId === "home" ? "home" : "away",
      text,
      preset,
      genericOnly: false,
    });
  };

  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
      <h2 className="mb-4 text-lg font-bold text-white">Penalty-Details</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-[#F7D117] px-5 py-2 text-sm font-black text-black uppercase"
          onClick={() => emitTriggerGenericFlag()}
        >
          Nur FLAG
        </button>
        <button
          type="button"
          className="rounded bg-zinc-700 px-4 py-2 text-sm text-white"
          onClick={() => emitClearPenalty()}
        >
          Ausblenden
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className="rounded bg-red-900/80 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
            onClick={() =>
              emitTriggerPenalty({
                teamId: "home",
                text: p,
                preset: p as PenaltyPreset,
                genericOnly: false,
              })
            }
          >
            {p} (Home)
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={`away-${p}`}
            type="button"
            className="rounded bg-red-950 px-3 py-2 text-xs font-semibold text-red-100"
            onClick={() =>
              emitTriggerPenalty({
                teamId: "away",
                text: p,
                preset: p as PenaltyPreset,
                genericOnly: false,
              })
            }
          >
            {p} (Away)
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-white"
          placeholder="Custom penalty text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          type="button"
          className="rounded bg-red-700 px-4 py-2 font-bold text-white"
          onClick={() => custom && throwFlag(custom)}
        >
          Throw flag
        </button>
        <button
          type="button"
          className="rounded bg-zinc-700 px-4 py-2 text-white"
          onClick={() => emitClearPenalty()}
        >
          Clear
        </button>
      </div>
    </section>
  );
}
