import { CONTROL_SESSION_COOKIE, getAuthApiUrl } from "@/lib/auth/config";
import type { ScoreboardState } from "@/lib/types/scoreboard";
import type { BoardRecord } from "./board-repository";
import * as local from "./board-repository";
import {
  remoteBoardExists,
  remoteCreateBoard,
  remoteDeleteBoard,
  remoteGetBoard,
  remoteListBoards,
  remoteLoadBoardState,
  remoteSaveBoardState,
  remoteUpdateBoardName,
  useRemoteBoards,
} from "./remote-boards";

export type { BoardRecord } from "./board-repository";

async function sessionToken(): Promise<string | null> {
  if (!getAuthApiUrl()) return null;
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return jar.get(CONTROL_SESSION_COOKIE)?.value ?? null;
}

export function boardExists(boardId: string): boolean {
  if (useRemoteBoards()) {
    throw new Error("boardExists is sync-only for local boards; use boardExistsAsync");
  }
  return local.boardExists(boardId);
}

export async function boardExistsAsync(boardId: string): Promise<boolean> {
  if (useRemoteBoards()) return remoteBoardExists(boardId);
  return local.boardExists(boardId);
}

export function loadBoardState(boardId: string): ScoreboardState | null {
  if (useRemoteBoards()) {
    throw new Error("loadBoardState is sync-only for local boards; use loadBoardStateAsync");
  }
  return local.loadBoardState(boardId);
}

export async function loadBoardStateAsync(
  boardId: string,
): Promise<ScoreboardState | null> {
  if (useRemoteBoards()) return remoteLoadBoardState(boardId);
  return local.loadBoardState(boardId);
}

export function saveBoardState(boardId: string, state: ScoreboardState): void {
  if (useRemoteBoards()) {
    void remoteSaveBoardState(boardId, state);
    return;
  }
  local.saveBoardState(boardId, state);
}

export function getBoard(boardId: string): BoardRecord | null {
  if (useRemoteBoards()) {
    throw new Error("getBoard is sync-only for local boards; use getBoardAsync");
  }
  return local.getBoard(boardId);
}

export async function getBoardAsync(boardId: string): Promise<BoardRecord | null> {
  if (useRemoteBoards()) {
    const token = await sessionToken();
    return remoteGetBoard(boardId, token ?? undefined);
  }
  return local.getBoard(boardId);
}

export function listBoardsForOwner(ownerUserId: string): BoardRecord[] {
  if (useRemoteBoards()) {
    throw new Error("use listBoardsForSessionAsync with remote boards");
  }
  return local.listBoardsForOwner(ownerUserId);
}

export function listAllBoards(): BoardRecord[] {
  if (useRemoteBoards()) {
    throw new Error("use listBoardsForSessionAsync with remote boards");
  }
  return local.listAllBoards();
}

export async function listBoardsForSessionAsync(
  user: { id: string } | null,
): Promise<BoardRecord[]> {
  if (useRemoteBoards()) {
    if (!user || user.id === "shared-password" || user.id === "local") {
      return [];
    }
    const token = await sessionToken();
    if (!token) return [];
    return remoteListBoards(token);
  }
  if (user?.id && user.id !== "shared-password" && user.id !== "local") {
    return local.listBoardsForOwner(user.id);
  }
  return local.listAllBoards();
}

export function createBoard(input: {
  name: string;
  ownerUserId?: string | null;
  state?: ScoreboardState;
}): BoardRecord {
  if (useRemoteBoards()) {
    throw new Error("use createBoardAsync with remote boards");
  }
  return local.createBoard(input);
}

export async function createBoardAsync(
  input: {
    name: string;
    ownerUserId?: string | null;
    state?: ScoreboardState;
  },
  token?: string,
): Promise<BoardRecord | null> {
  if (useRemoteBoards()) {
    const authToken = token ?? (await sessionToken());
    if (!authToken) return null;
    return remoteCreateBoard(authToken, {
      name: input.name,
      state: input.state,
    });
  }
  return local.createBoard(input);
}

export function updateBoardName(
  boardId: string,
  name: string,
): BoardRecord | null {
  if (useRemoteBoards()) {
    throw new Error("use updateBoardNameAsync with remote boards");
  }
  return local.updateBoardName(boardId, name);
}

export async function updateBoardNameAsync(
  boardId: string,
  name: string,
): Promise<BoardRecord | null> {
  if (useRemoteBoards()) {
    const token = await sessionToken();
    if (!token) return null;
    return remoteUpdateBoardName(token, boardId, name);
  }
  return local.updateBoardName(boardId, name);
}

export function deleteBoard(boardId: string): boolean {
  if (useRemoteBoards()) {
    throw new Error("use deleteBoardAsync with remote boards");
  }
  return local.deleteBoard(boardId);
}

export async function deleteBoardAsync(boardId: string): Promise<boolean> {
  if (useRemoteBoards()) {
    const token = await sessionToken();
    if (!token) return false;
    return remoteDeleteBoard(token, boardId);
  }
  return local.deleteBoard(boardId);
}

export function countBoards(): number {
  if (useRemoteBoards()) return 0;
  return local.countBoards();
}
