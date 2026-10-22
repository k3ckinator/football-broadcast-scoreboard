import type { BoardRecord } from "./board-repository";
import type { SessionUser } from "./session-user";

export function canManageBoard(
  user: SessionUser,
  board: BoardRecord,
): boolean {
  if (user.id === "local" || user.id === "shared-password") {
    return true;
  }
  if (board.ownerUserId === null) {
    return true;
  }
  return board.ownerUserId === user.id;
}

export function normalizeBoardName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Neues Scoreboard";
  return trimmed.slice(0, 80);
}
