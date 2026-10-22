import { NextResponse } from "next/server";
import {
  createBoard,
  listAllBoards,
  listBoardsForOwner,
} from "@/lib/server/board-repository";
import { getSessionUser } from "@/lib/server/session-user";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  const boards = user?.id
    ? user.id === "shared-password" || user.id === "local"
      ? listAllBoards()
      : listBoardsForOwner(user.id)
    : listAllBoards();

  return NextResponse.json({
    boards: boards.map((b) => ({
      id: b.id,
      name: b.name,
      ownerUserId: b.ownerUserId,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = body.name?.trim() || "Neues Scoreboard";
  const ownerUserId =
    user.id === "shared-password" || user.id === "local" ? null : user.id;

  const board = createBoard({ name, ownerUserId });
  return NextResponse.json({ board }, { status: 201 });
}
