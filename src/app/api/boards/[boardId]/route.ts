import { NextResponse } from "next/server";
import { canManageBoard, normalizeBoardName } from "@/lib/server/board-access";
import type { BoardRecord } from "@/lib/server/board-store";
import {
  deleteBoardAsync,
  getBoardAsync,
  updateBoardNameAsync,
} from "@/lib/server/board-store";
import { evictBoardRuntime } from "@/lib/server/scoreboard-runtime";
import { getSessionUserForBoardApi } from "@/lib/server/session-user";

export const runtime = "nodejs";

type Params = { params: Promise<{ boardId: string }> };

function boardJson(board: BoardRecord) {
  return {
    id: board.id,
    name: board.name,
    ownerUserId: board.ownerUserId,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

export async function GET(_request: Request, { params }: Params) {
  const { boardId } = await params;
  const board = await getBoardAsync(boardId);
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ board: boardJson(board) });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUserForBoardApi();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const board = await getBoardAsync(boardId);
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageBoard(user, board)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = normalizeBoardName(body.name ?? board.name);
  const updated = await updateBoardNameAsync(boardId, name);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ board: boardJson(updated) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUserForBoardApi();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const board = await getBoardAsync(boardId);
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageBoard(user, board)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ok = await deleteBoardAsync(boardId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  evictBoardRuntime(boardId);
  return NextResponse.json({ ok: true });
}
