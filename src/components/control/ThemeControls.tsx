"use client";

import { emitPatch } from "@/lib/socket-client";
import { useScoreboardStore } from "@/store/useScoreboardStore";
import { ColorField } from "./ColorField";

export function ThemeControls() {
  const theme = useScoreboardStore((s) => s.state.theme);

  const patchTheme = (key: keyof typeof theme, value: string | number) => {
    emitPatch({ theme: { [key]: value } });
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <h3 className="mb-3 text-base font-bold text-white">Globales Design</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <ColorField
          label="Status bar text"
          value={theme.statusBarText}
          onChange={(v) => patchTheme("statusBarText", v)}
        />
        <ColorField
          label="Status bar border"
          value={theme.statusBarBorder}
          onChange={(v) => patchTheme("statusBarBorder", v)}
        />
        <ColorField
          label="Possession"
          value={theme.possessionColor}
          onChange={(v) => patchTheme("possessionColor", v)}
        />
        <ColorField
          label="Flagge (Hintergrund)"
          value={theme.penaltyBackground}
          onChange={(v) => patchTheme("penaltyBackground", v)}
        />
        <ColorField
          label="Flagge (Text)"
          value={theme.penaltyText}
          onChange={(v) => patchTheme("penaltyText", v)}
        />
      </div>
      <label className="mt-4 block text-sm text-zinc-300">
        Parallelogram skew ({theme.skewDegrees}°)
        <input
          type="range"
          min={8}
          max={24}
          value={theme.skewDegrees}
          className="mt-2 w-full"
          onChange={(e) => patchTheme("skewDegrees", Number(e.target.value))}
        />
      </label>
      <label className="mt-3 block text-sm text-zinc-300">
        Status bar background (CSS)
        <input
          className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
          value={theme.statusBarBackground}
          onChange={(e) => patchTheme("statusBarBackground", e.target.value)}
        />
      </label>
    </div>
  );
}
