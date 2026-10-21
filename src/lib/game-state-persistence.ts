import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { defaultScoreboardState } from "@/lib/defaults";
import { normalizeScoreboardState } from "@/lib/merge-state";
import type { ScoreboardState } from "@/lib/types/scoreboard";

const DEFAULT_PATH = path.join(process.cwd(), "data", "game-state.json");

export function gameStateFilePath(): string {
  return process.env.GAME_STATE_PATH?.trim() || DEFAULT_PATH;
}

export async function loadPersistedGameState(): Promise<ScoreboardState | null> {
  try {
    const raw = await readFile(gameStateFilePath(), "utf8");
    const parsed = JSON.parse(raw) as ScoreboardState;
    const normalized = normalizeScoreboardState({
      ...parsed,
      gameClockRunning: false,
    });
    return normalized;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function schedulePersistGameState(state: ScoreboardState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void persistGameStateNow(state);
  }, 400);
}

async function persistGameStateNow(state: ScoreboardState): Promise<void> {
  const filePath = gameStateFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const snapshot = normalizeScoreboardState({
    ...state,
    gameClockRunning: false,
    lastScoreChange: undefined,
  });
  await writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf8");
}

export function initialGameState(): ScoreboardState {
  return defaultScoreboardState();
}
