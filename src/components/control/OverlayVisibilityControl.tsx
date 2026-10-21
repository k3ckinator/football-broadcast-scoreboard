"use client";

import { emitPatch } from "@/lib/socket-client";
import { useScoreboardStore } from "@/store/useScoreboardStore";

type OverlayVisibilityControlProps = {
  variant?: "compact" | "prominent";
};

export function OverlayVisibilityControl({
  variant = "compact",
}: OverlayVisibilityControlProps) {
  const visible = useScoreboardStore((s) => s.state.overlayVisible);

  const setVisible = (overlayVisible: boolean) => emitPatch({ overlayVisible });

  if (variant === "prominent") {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
          visible
            ? "border-emerald-900/60 bg-emerald-950/30"
            : "border-amber-900/60 bg-amber-950/40"
        }`}
      >
        <div>
          <p className="text-sm font-bold text-white">OBS-Overlay</p>
          <p className="text-xs text-zinc-400">
            {visible
              ? "Scoreboard wird in OBS angezeigt."
              : "Overlay ist aus — OBS zeigt eine leere Fläche."}
          </p>
        </div>
        <button
          type="button"
          className={`rounded-lg px-5 py-2.5 text-sm font-black uppercase tracking-wide ${
            visible
              ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          }`}
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Overlay ausblenden" : "Overlay einblenden"}
        </button>
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-300">
      <input
        type="checkbox"
        checked={visible}
        onChange={(e) => setVisible(e.target.checked)}
      />
      Overlay komplett ausblenden (OBS leer)
    </label>
  );
}
