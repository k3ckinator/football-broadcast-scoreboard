import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  UPLOAD_DIR,
  isSafeUploadFilename,
  logoContentType,
} from "@/lib/uploads";

export const runtime = "nodejs";

type Params = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { filename } = await params;
  if (!isSafeUploadFilename(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": logoContentType(filename),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
