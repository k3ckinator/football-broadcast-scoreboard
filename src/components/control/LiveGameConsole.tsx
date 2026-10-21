"use client";

import { useState } from "react";
import {
  emitClearEvent,
  emitClearPenalty,
  emitClockStart,
  emitClockStop,
  emitPatch,
  emitScoreDelta,
  emitTriggerEvent,
  emitTriggerGenericFlag,
} from "@/lib/socket-client";
import {
  adjustGameClock,
  formatGameClock,
  parseGameClock,
} from "@/lib/game-clock";
import type { EventBannerType, Quarter, TeamState } from "@/lib/types/scoreboard";
import { useScoreboardStore } from "@/store/useScoreboardStore";
import { DownDistanceControls } from "./DownDistanceControls";
import { OverlayVisibilityControl } from "./OverlayVisibilityControl";

const QUARTERS: Quarter[] = ["1ST", "2ND", "3RD", "4TH", "OT"];

const EVENTS: { type: NonNullable<EventBannerType>; label: string }[] = [
  { type: "touchdown", label: "Touchdown" },
  { type: "fieldgoal", label: "Field Goal" },
  { type: "pat", label: "PAT" },
  { type: "twoPoint", label: "2-Point Conv." },
  { type: "safety", label: "Safety" },
  { type: "turnover", label: "Turnover" },
];

const SCORE_BTNS = [
  { label: "TD +6", delta: 6 },
  { label: "PAT +1", delta: 1 },
  { label: "2PT +2", delta: 2 },
  { label: "FG +3", delta: 3 },
  { label: "Safety +2", delta: 2 },
];

function patchTeam(teamId: "home" | "away", patch: Partial<TeamState>) {
  emitPatch({ [teamId]: patch });
}

function TeamScorePanel({ teamId }: { teamId: "home" | "away" }) {
  const team = useScoreboardStore((s) => s.state[teamId]);
  const title = teamId === "home" ? "Links (Home)" : "Rechts (Away)";

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-zinc-300">{title}</h3>
        <span className="text-xs text-zinc-500">{team.abbreviation}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-zinc-400">
          Score
          <input
            type="number"
            min={0}
            className="mt-1 block w-28 rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-3xl font-black text-white"
            value={team.score}
            onChange={(e) =>
              patchTeam(teamId, { score: Math.max(0, Number(e.target.value)) })
            }
          />
        </label>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {SCORE_BTNS.map((btn) => (
            <button
              key={btn.label}
              type="button"
              className="rounded bg-emerald-800 px-2.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              onClick={() => emitScoreDelta({ teamId, delta: btn.delta })}
            >
              {btn.label}
            </button>
          ))}
          <button
            type="button"
            className="rounded bg-zinc-700 px-2.5 py-2 text-xs font-bold text-white"
            onClick={() => emitScoreDelta({ teamId, delta: -1 })}
          >
            −1
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-800 pt-3">
        <span className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
          Timeouts
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
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
          <button
            type="button"
            className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-bold text-white"
            onClick={() =>
              patchTeam(teamId, {
                timeouts: {
                  ...team.timeouts,
                  used: Math.min(
                    team.timeouts.total,
                    team.timeouts.used + 1,
                  ),
                },
              })
            }
          >
            Timeout −1
          </button>
          <button
            type="button"
            className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-bold text-white"
            onClick={() =>
              patchTeam(teamId, {
                timeouts: { ...team.timeouts, used: 0 },
              })
            }
          >
            Reset
          </button>
          <span className="text-xs text-zinc-500">
            {team.timeouts.total - team.timeouts.used} / {team.timeouts.total}{" "}
            übrig
          </span>
        </div>
      </div>
    </div>
  );
}

export function LiveGameConsole() {
  const state = useScoreboardStore((s) => s.state);
  const [eventTeamId, setEventTeamId] = useState<"home" | "away">("home");

  const bumpClock = (delta: number) => {
    emitPatch({
      gameClock: adjustGameClock(state.gameClock, delta),
      gameClockRunning: state.gameClockRunning,
    });
  };

  return (
    <section className="rounded-xl border-2 border-emerald-900/50 bg-zinc-900/40 p-5">
      <h2 className="mb-1 text-xl font-black text-white">Live-Steuerung</h2>
      <p className="mb-5 text-sm text-zinc-400">
        Score, Spielzustand und Ereignisse — alles für den laufenden Broadcast.
      </p>

      <div className="mb-5">
        <OverlayVisibilityControl variant="prominent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TeamScorePanel teamId="home" />
        <TeamScorePanel teamId="away" />
      </div>

      <div className="mt-5 space-y-4 border-t border-zinc-800 pt-5">
        <div>
          <span className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
            Quarter
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUARTERS.map((q) => (
              <button
                key={q}
                type="button"
                className={`rounded px-3 py-1.5 text-sm font-bold ${
                  state.quarter === q
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
                onClick={() => emitPatch({ quarter: q })}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <DownDistanceControls />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-5">
        <span className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
          Flag
        </span>
        <button
          type="button"
          className="rounded-lg bg-[#F7D117] px-6 py-3 text-base font-black tracking-widest text-black uppercase shadow-md hover:brightness-105"
          onClick={() => emitTriggerGenericFlag()}
        >
          Flag
        </button>
        <button
          type="button"
          className="rounded-lg bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-200"
          onClick={() => emitClearPenalty()}
        >
          Flag aus
        </button>
        <span className="text-xs text-zinc-500">
          Erst nur „FLAG“, danach konkrete Strafe unten bei Penalties wählen.
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-5">
        <span className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
          Ballbesitz
        </span>
        {(
          [
            ["home", state.home.abbreviation],
            ["away", state.away.abbreviation],
            ["none", "Keiner"],
          ] as const
        ).map(([id, lbl]) => (
          <button
            key={id}
            type="button"
            className={`rounded px-4 py-2 text-sm font-bold ${
              state.possession === id
                ? "bg-amber-600 text-white"
                : "bg-zinc-800 text-zinc-300"
            }`}
            onClick={() => emitPatch({ possession: id })}
          >
            {lbl}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={state.showPossession}
            onChange={(e) => emitPatch({ showPossession: e.target.checked })}
          />
          Icon anzeigen
        </label>
      </div>

      <div className="mt-5 border-t border-zinc-800 pt-5">
        <span className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
          Spielereignis (Overlay)
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm font-bold ${
              eventTeamId === "home"
                ? "bg-emerald-700 text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
            onClick={() => setEventTeamId("home")}
          >
            {state.home.abbreviation}
          </button>
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm font-bold ${
              eventTeamId === "away"
                ? "bg-emerald-700 text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
            onClick={() => setEventTeamId("away")}
          >
            {state.away.abbreviation}
          </button>
          <span className="mx-1 text-zinc-600">|</span>
          {EVENTS.map((ev) => (
            <button
              key={ev.type}
              type="button"
              className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-600"
              onClick={() =>
                emitTriggerEvent({ type: ev.type, teamId: eventTeamId })
              }
            >
              {ev.label}
            </button>
          ))}
          <button
            type="button"
            className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
            onClick={() => emitClearEvent()}
          >
            Aus
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-zinc-800 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
            Spieluhr
          </span>
          <label className="flex items-center gap-1.5 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={state.showGameClock}
              onChange={(e) => emitPatch({ showGameClock: e.target.checked })}
            />
            Anzeigen
          </label>
          {state.gameClockRunning ? (
            <button
              type="button"
              className="rounded bg-red-800 px-3 py-1 text-xs font-bold text-white"
              onClick={() => emitClockStop()}
            >
              Stopp
            </button>
          ) : (
            <button
              type="button"
              className="rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white"
              onClick={() => emitClockStart()}
            >
              Start
            </button>
          )}
          <span
            className={`text-xs font-bold ${
              state.gameClockRunning ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            {state.gameClockRunning ? "Läuft" : "Pause"}
          </span>
        </div>
        <input
          className="mt-2 w-full max-w-[180px] rounded border border-zinc-600 bg-zinc-950 px-3 py-2 font-mono text-2xl font-bold text-white"
          value={state.gameClock}
          onChange={(e) => emitPatch({ gameClock: e.target.value })}
          onBlur={(e) => {
            const parsed = parseGameClock(e.target.value);
            if (parsed === null) return;
            const formatted = formatGameClock(parsed);
            if (formatted !== e.target.value) {
              emitPatch({ gameClock: formatted });
            }
          }}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            className="rounded bg-zinc-800 px-2 py-1 text-xs font-bold"
            onClick={() => bumpClock(-10)}
          >
            −10s
          </button>
          <button
            type="button"
            className="rounded bg-zinc-800 px-2 py-1 text-xs font-bold"
            onClick={() => bumpClock(-1)}
          >
            −1s
          </button>
          <button
            type="button"
            className="rounded bg-zinc-800 px-2 py-1 text-xs font-bold"
            onClick={() => bumpClock(1)}
          >
            +1s
          </button>
          <button
            type="button"
            className="rounded bg-zinc-800 px-2 py-1 text-xs font-bold"
            onClick={() => bumpClock(10)}
          >
            +10s
          </button>
          {[15, 12, 10, 8, 6, 2, 0].map((min) => (
            <button
              key={min}
              type="button"
              className="rounded bg-blue-900/50 px-2 py-1 text-xs font-bold text-blue-100"
              onClick={() =>
                emitPatch({
                  gameClock: formatGameClock(min * 60),
                  gameClockRunning: false,
                })
              }
            >
              {min}:00
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
