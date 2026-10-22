import { NextResponse } from "next/server";
import { normalizeBoardName } from "@/lib/server/board-access";
import {
  createBoardAsync,
  listBoardsForSessionAsync,
} from "@/lib/server/board-store";
import {
  getSessionUser,
  getSessionUserForBoardApi,
} from "@/lib/server/session-user";
import { getAuthApiUrl } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  const boards = await listBoardsForSessionAsync(user);

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
  const user = await getSessionUserForBoardApi();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (getAuthApiUrl() && (user.id === "shared-password" || user.id === "local")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = normalizeBoardName(body.name ?? "");
  const ownerUserId =
    user.id === "shared-password" || user.id === "local" ? null : user.id;

  const board = await createBoardAsync({ name, ownerUserId });
  if (!board) {
    return NextResponse.json({ error: "Could not create board" }, { status: 502 });
  }
  return NextResponse.json({ board }, { status: 201 });
}
