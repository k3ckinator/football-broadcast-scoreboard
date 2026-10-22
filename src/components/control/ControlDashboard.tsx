"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScoreboardOverlay } from "@/components/overlay/ScoreboardOverlay";
import { useScoreboardStore } from "@/store/useScoreboardStore";
import { BoardNameEditor } from "./BoardNameEditor";
import { DisplaySettings } from "./DisplaySettings";
import { LiveGameConsole } from "./LiveGameConsole";
import { PenaltyControls } from "./PenaltyControls";
import { PresetControls } from "./PresetControls";
import { TeamSetupControls } from "./TeamSetupControls";
import { ThemeControls } from "./ThemeControls";
import { ControlAuthMenu } from "./ControlAuthMenu";

export function ControlDashboard({ boardId }: { boardId: string }) {
  const connected = useScoreboardStore((s) => s.connected);
  const [boardName, setBoardName] = useState("Scoreboard");

  useEffect(() => {
    void fetch(`/api/boards/${boardId}`)
      .then((r) => r.json())
      .then((data: { board?: { name: string } }) => {
        if (data.board?.name) setBoardName(data.board.name);
      })
      .catch(() => undefined);
  }, [boardId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <BoardNameEditor
              boardId={boardId}
              initialName={boardName}
              variant="header"
              onRenamed={setBoardName}
            />
            <p className="mt-1 text-sm text-zinc-400">
              Einstellungen oben · Live-Steuerung unten
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase ${
                connected
                  ? "bg-emerald-900/50 text-emerald-300"
                  : "bg-red-900/50 text-red-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`}
              />
              {connected ? "Live" : "Getrennt"}
            </span>
            <ControlAuthMenu />
            <Link
              href={`/overlay/${boardId}`}
              target="_blank"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
            >
              Overlay öffnen
            </Link>
            <Link
              href="/control"
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-200"
            >
              Alle Boards
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/30">
          <div className="border-b border-zinc-800 px-4 py-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Vorschau
          </div>
          <div
            className="relative overflow-hidden"
            style={{
              height: 220,
              background:
                "repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%) 50% / 24px 24px",
            }}
          >
            <div
              className="pointer-events-none absolute top-0 left-1/2 origin-top -translate-x-1/2 scale-[0.22]"
              style={{ width: 1920, height: 1080 }}
            >
              <ScoreboardOverlay />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-black tracking-wide text-zinc-200 uppercase">
            Einstellungen
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <TeamSetupControls teamId="home" label="Team links (Home)" />
            <TeamSetupControls teamId="away" label="Team rechts (Away)" />
          </div>
          <div className="mt-4 space-y-4">
            <ThemeControls />
            <DisplaySettings />
          </div>
        </section>

        <LiveGameConsole />

        <div className="grid gap-4 lg:grid-cols-2">
          <PenaltyControls />
          <PresetControls />
        </div>

        <section className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
          <strong className="text-zinc-200">OBS:</strong> Browser-Quelle 1920×1080
          →{" "}
          <code className="text-emerald-400">/overlay/{boardId}</code>
        </section>
      </main>
    </div>
  );
}
