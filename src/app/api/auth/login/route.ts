import { NextResponse } from "next/server";
import {
  CONTROL_SESSION_COOKIE,
  getAuthApiUrl,
  getAuthSecret,
  getControlAccessPassword,
  isControlAuthEnabled,
} from "@/lib/auth/config";
import { remoteLogin, sessionMaxAgeSeconds } from "@/lib/auth/remote";
import { createSessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (getAuthApiUrl()) {
    return loginWithAuthServer(request);
  }

  if (!isControlAuthEnabled()) {
    return NextResponse.json({ ok: true, authEnabled: false, mode: "off" });
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const password = body.password ?? "";
  const expected = getControlAccessPassword();
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken(getAuthSecret());
  const response = NextResponse.json({
    ok: true,
    authEnabled: true,
    mode: "password",
  });
  response.cookies.set(CONTROL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}

async function loginWithAuthServer(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const result = await remoteLogin(body.email ?? "", body.password ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({
    ok: true,
    authEnabled: true,
    mode: "accounts",
    user: result.user,
  });
  response.cookies.set(CONTROL_SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAgeSeconds(result.expiresAt),
  });
  return response;
}
