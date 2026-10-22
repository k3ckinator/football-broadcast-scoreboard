import { readFile } from "node:fs/promises";
import { gameStateFilePath, initialGameState } from "@/lib/game-state-persistence";
import { normalizeScoreboardState } from "@/lib/merge-state";
import type { ScoreboardState } from "@/lib/types/scoreboard";
import { getAuthApiUrl } from "@/lib/auth/config";
import { countBoards, createBoard } from "./board-store";

export async function ensureDefaultBoards(): Promise<void> {
  if (getAuthApiUrl()) return;
  if (countBoards() > 0) return;

  let legacy: ScoreboardState | null = null;
  try {
    const raw = await readFile(gameStateFilePath(), "utf8");
    legacy = normalizeScoreboardState({
      ...(JSON.parse(raw) as ScoreboardState),
      gameClockRunning: false,
    });
  } catch {
    legacy = null;
  }

  createBoard({
    name: "Haupt-Scoreboard",
    ownerUserId: null,
    state: legacy ?? initialGameState(),
  });
  console.log("> Created default scoreboard in SQLite");
}
