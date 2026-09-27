"use client";

import { emitPatch } from "@/lib/socket-client";
import { teamFill, teamTimeoutColor, withTeamFill } from "@/lib/team-colors";
import type { TeamState } from "@/lib/types/scoreboard";
import { useScoreboardStore } from "@/store/useScoreboardStore";
import { ColorField } from "./ColorField";

interface TeamSetupControlsProps {
  teamId: "home" | "away";
  label: string;
}

function patchTeam(teamId: "home" | "away", patch: Partial<TeamState>) {
  emitPatch({ [teamId]: patch });
}

export function TeamSetupControls({ teamId, label }: TeamSetupControlsProps) {
  const team = useScoreboardStore((s) => s.state[teamId]);

  const uploadLogo = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) return;
    const { url } = (await res.json()) as { url: string };
    patchTeam(teamId, { logoUrl: url });
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <h3 className="mb-3 text-base font-bold text-white">{label}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-zinc-300">
          Teamname
          <input
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
            value={team.name}
            onChange={(e) => patchTeam(teamId, { name: e.target.value })}
          />
        </label>
        <label className="text-sm text-zinc-300">
          Kürzel
          <input
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 uppercase text-white"
            maxLength={4}
            value={team.abbreviation}
            onChange={(e) =>
              patchTeam(teamId, { abbreviation: e.target.value.toUpperCase() })
            }
          />
        </label>
      </div>

      <div className="mt-3">
        <label className="text-sm text-zinc-300">
          Logo
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-zinc-400"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadLogo(f);
            }}
          />
        </label>
        {team.logoUrl && (
          <button
            type="button"
            className="mt-1 text-xs text-red-400 underline"
            onClick={() => patchTeam(teamId, { logoUrl: null })}
          >
            Logo entfernen
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ColorField
          label="Teamfläche"
          value={teamFill(team.colors)}
          onChange={(v) =>
            patchTeam(teamId, { colors: withTeamFill(team.colors, v) })
          }
        />
        <ColorField
          label="Score-Text"
          value={team.colors.scoreText}
          onChange={(v) =>
            patchTeam(teamId, { colors: { ...team.colors, scoreText: v } })
          }
        />
        <ColorField
          label="Rahmen"
          value={team.colors.border}
          onChange={(v) =>
            patchTeam(teamId, { colors: { ...team.colors, border: v } })
          }
        />
        <ColorField
          label="Timeout"
          value={teamTimeoutColor(team.colors)}
          onChange={(v) =>
            patchTeam(teamId, {
              colors: { ...team.colors, timeout: v, accent: v },
            })
          }
        />
        <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm sm:col-span-2">
          <span className="text-zinc-300">Rahmenstärke</span>
          <input
            type="range"
            min={0}
            max={12}
            value={team.colors.borderWidth ?? 5}
            onChange={(e) =>
              patchTeam(teamId, {
                colors: {
                  ...team.colors,
                  borderWidth: Number(e.target.value),
                },
              })
            }
            className="w-32"
          />
          <span className="w-6 text-right text-zinc-400 tabular-nums">
            {team.colors.borderWidth ?? 5}px
          </span>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2 text-sm">
        <span className="font-semibold text-zinc-400">Timeouts</span>
        <label className="flex items-center gap-1.5 text-zinc-400">
          <input
            type="checkbox"
            checked={team.timeouts.visible}
            onChange={(e) =>
              patchTeam(teamId, {
                timeouts: { ...team.timeouts, visible: e.target.checked },
              })
            }
          />
          Anzeigen
        </label>
        <label className="text-zinc-400">
          Anzahl
          <input
            type="number"
            min={0}
            max={5}
            className="ml-1 w-12 rounded border border-zinc-600 bg-zinc-950 px-1 py-0.5 text-white"
            value={team.timeouts.total}
            onChange={(e) =>
              patchTeam(teamId, {
                timeouts: {
                  ...team.timeouts,
                  total: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <label className="text-zinc-400">
          Genutzt
          <input
            type="number"
            min={0}
            max={team.timeouts.total}
            className="ml-1 w-12 rounded border border-zinc-600 bg-zinc-950 px-1 py-0.5 text-white"
            value={team.timeouts.used}
            onChange={(e) =>
              patchTeam(teamId, {
                timeouts: {
                  ...team.timeouts,
                  used: Math.min(
                    team.timeouts.total,
                    Math.max(0, Number(e.target.value)),
                  ),
                },
              })
            }
          />
        </label>
        <button
          type="button"
          className="rounded bg-zinc-700 px-2 py-1 text-xs text-white"
          onClick={() =>
            patchTeam(teamId, {
              timeouts: { ...team.timeouts, used: team.timeouts.used + 1 },
            })
          }
        >
          −1 Timeout
        </button>
        <button
          type="button"
          className="rounded bg-zinc-700 px-2 py-1 text-xs text-white"
          onClick={() =>
            patchTeam(teamId, { timeouts: { ...team.timeouts, used: 0 } })
          }
        >
          Reset
        </button>
      </div>
    </div>
  );
}
