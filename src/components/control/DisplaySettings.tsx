"use client";

import { emitPatch } from "@/lib/socket-client";
import { useScoreboardStore } from "@/store/useScoreboardStore";

export function DisplaySettings() {
  const state = useScoreboardStore((s) => s.state);

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-300">
      <span className="w-full text-xs font-bold tracking-wide text-zinc-500 uppercase">
        Overlay-Anzeige
      </span>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={state.overlayVisible}
          onChange={(e) => emitPatch({ overlayVisible: e.target.checked })}
        />
        Scoreboard sichtbar
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={state.showTeamNames}
          onChange={(e) => emitPatch({ showTeamNames: e.target.checked })}
        />
        Teamnamen
      </label>
    </div>
  );
}
