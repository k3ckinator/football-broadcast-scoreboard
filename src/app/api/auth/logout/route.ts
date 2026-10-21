import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CONTROL_SESSION_COOKIE, getAuthApiUrl } from "@/lib/auth/config";
import { remoteLogout } from "@/lib/auth/remote";

export async function POST() {
  if (getAuthApiUrl()) {
    const jar = await cookies();
    const token = jar.get(CONTROL_SESSION_COOKIE)?.value;
    if (token) await remoteLogout(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CONTROL_SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
