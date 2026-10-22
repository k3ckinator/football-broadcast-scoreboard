import { getAuthApiUrl } from "@/lib/auth/config";
import { initialGameState } from "@/lib/game-state-persistence";
import { normalizeScoreboardState } from "@/lib/merge-state";
import type { ScoreboardState } from "@/lib/types/scoreboard";
import type { BoardRecord } from "./board-repository";

export function useRemoteBoards(): boolean {
  return Boolean(getAuthApiUrl());
}

function authBase(): string {
  const base = getAuthApiUrl();
  if (!base) throw new Error("AUTH_API_URL is not set");
  return base;
}

function serviceKey(): string | null {
  return process.env.SCOREBOARD_SERVICE_KEY?.trim() || null;
}

function authHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function serviceHeaders(): HeadersInit {
  const key = serviceKey();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (key) headers["X-Scoreboard-Service-Key"] = key;
  return headers;
}

type RemoteBoardMeta = {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: number;
  updatedAt: number;
};

function toRecord(meta: RemoteBoardMeta): BoardRecord {
  return {
    id: meta.id,
    ownerUserId: meta.ownerUserId,
    name: meta.name,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
  };
}

function normalizeLoadedState(state: unknown): ScoreboardState {
  const base = initialGameState();
  if (typeof state === "object" && state !== null) {
    return normalizeScoreboardState({
      ...base,
      ...(state as ScoreboardState),
      gameClockRunning: false,
    });
  }
  return normalizeScoreboardState({ ...base, gameClockRunning: false });
}

export async function remoteBoardExists(boardId: string): Promise<boolean> {
  try {
    const response = await fetch(`${authBase()}/boards/${encodeURIComponent(boardId)}`, {
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function remoteLoadBoardState(
  boardId: string,
): Promise<ScoreboardState | null> {
  try {
    const response = await fetch(`${authBase()}/boards/${encodeURIComponent(boardId)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { board?: { state?: unknown } };
    if (!data.board) return null;
    return normalizeLoadedState(data.board.state ?? initialGameState());
  } catch {
    return null;
  }
}

export async function remoteSaveBoardState(
  boardId: string,
  state: ScoreboardState,
): Promise<void> {
  const snapshot = normalizeScoreboardState({
    ...state,
    gameClockRunning: false,
    lastScoreChange: undefined,
  });
  const headers = serviceHeaders();
  if (!serviceKey()) {
    console.warn(
      "> SCOREBOARD_SERVICE_KEY fehlt — Spielstand wird nicht an scoreboard-auth gespeichert.",
    );
    return;
  }
  try {
    await fetch(`${authBase()}/boards/${encodeURIComponent(boardId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ state: snapshot }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("> remoteSaveBoardState failed:", error);
  }
}

export async function remoteListBoards(token: string): Promise<BoardRecord[]> {
  const response = await fetch(`${authBase()}/boards`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { boards?: RemoteBoardMeta[] };
  return (data.boards ?? []).map(toRecord);
}

export async function remoteGetBoard(
  boardId: string,
  token?: string,
): Promise<BoardRecord | null> {
  const response = await fetch(`${authBase()}/boards/${encodeURIComponent(boardId)}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { board?: RemoteBoardMeta };
  return data.board ? toRecord(data.board) : null;
}

export async function remoteCreateBoard(
  token: string,
  input: { name: string; state?: ScoreboardState },
): Promise<BoardRecord | null> {
  const response = await fetch(`${authBase()}/boards`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      state: input.state,
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { board?: RemoteBoardMeta };
  return data.board ? toRecord(data.board) : null;
}

export async function remoteUpdateBoardName(
  token: string,
  boardId: string,
  name: string,
): Promise<BoardRecord | null> {
  const response = await fetch(`${authBase()}/boards/${encodeURIComponent(boardId)}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { board?: RemoteBoardMeta };
  return data.board ? toRecord(data.board) : null;
}

export async function remoteDeleteBoard(
  token: string,
  boardId: string,
): Promise<boolean> {
  const response = await fetch(`${authBase()}/boards/${encodeURIComponent(boardId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
    cache: "no-store",
  });
  return response.ok;
}
