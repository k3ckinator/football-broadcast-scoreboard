import { nanoid } from "nanoid";
import { initialGameState } from "@/lib/game-state-persistence";
import { normalizeScoreboardState } from "@/lib/merge-state";
import type { ScoreboardState } from "@/lib/types/scoreboard";
import { getDatabase } from "./database";

export type BoardRecord = {
  id: string;
  ownerUserId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
};

function rowToBoard(row: BoardRow): BoardRecord {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type BoardRow = {
  id: string;
  owner_user_id: string | null;
  name: string;
  state_json: string;
  created_at: number;
  updated_at: number;
};

export function boardExists(boardId: string): boolean {
  const row = getDatabase()
    .prepare("SELECT 1 FROM boards WHERE id = ?")
    .get(boardId);
  return row !== undefined;
}

export function getBoard(boardId: string): BoardRecord | null {
  const row = getDatabase()
    .prepare(
      `SELECT id, owner_user_id, name, state_json, created_at, updated_at
       FROM boards WHERE id = ?`,
    )
    .get(boardId) as BoardRow | undefined;
  return row ? rowToBoard(row) : null;
}

export function loadBoardState(boardId: string): ScoreboardState | null {
  const row = getDatabase()
    .prepare("SELECT state_json FROM boards WHERE id = ?")
    .get(boardId) as { state_json: string } | undefined;
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.state_json) as ScoreboardState;
    return normalizeScoreboardState({
      ...parsed,
      gameClockRunning: false,
    });
  } catch {
    return null;
  }
}

export function saveBoardState(boardId: string, state: ScoreboardState): void {
  const snapshot = normalizeScoreboardState({
    ...state,
    gameClockRunning: false,
    lastScoreChange: undefined,
  });
  const now = Date.now();
  getDatabase()
    .prepare(
      `UPDATE boards SET state_json = ?, updated_at = ? WHERE id = ?`,
    )
    .run(JSON.stringify(snapshot), now, boardId);
}

export function listBoardsForOwner(ownerUserId: string): BoardRecord[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id, owner_user_id, name, state_json, created_at, updated_at
       FROM boards WHERE owner_user_id = ?
       ORDER BY updated_at DESC`,
    )
    .all(ownerUserId) as BoardRow[];
  return rows.map(rowToBoard);
}

export function listAllBoards(): BoardRecord[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id, owner_user_id, name, state_json, created_at, updated_at
       FROM boards ORDER BY updated_at DESC`,
    )
    .all() as BoardRow[];
  return rows.map(rowToBoard);
}

export function createBoard(input: {
  name: string;
  ownerUserId?: string | null;
  state?: ScoreboardState;
}): BoardRecord {
  const id = nanoid(12);
  const now = Date.now();
  const state = normalizeScoreboardState(
    input.state ?? initialGameState(),
  );
  getDatabase()
    .prepare(
      `INSERT INTO boards (id, owner_user_id, name, state_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.ownerUserId ?? null,
      input.name,
      JSON.stringify(state),
      now,
      now,
    );
  return {
    id,
    ownerUserId: input.ownerUserId ?? null,
    name: input.name,
    createdAt: now,
    updatedAt: now,
  };
}

export function countBoards(): number {
  const row = getDatabase()
    .prepare("SELECT COUNT(*) AS c FROM boards")
    .get() as { c: number };
  return row.c;
}

export function updateBoardName(boardId: string, name: string): BoardRecord | null {
  const board = getBoard(boardId);
  if (!board) return null;
  const now = Date.now();
  getDatabase()
    .prepare(`UPDATE boards SET name = ?, updated_at = ? WHERE id = ?`)
    .run(name, now, boardId);
  return { ...board, name, updatedAt: now };
}

export function deleteBoard(boardId: string): boolean {
  const result = getDatabase()
    .prepare("DELETE FROM boards WHERE id = ?")
    .run(boardId);
  return result.changes > 0;
}
