import { NextResponse } from "next/server";
import { CONTROL_SESSION_COOKIE, getAuthApiUrl } from "@/lib/auth/config";
import { remoteRegister, sessionMaxAgeSeconds } from "@/lib/auth/remote";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!getAuthApiUrl()) {
    return NextResponse.json(
      { error: "Registrierung ist nicht eingerichtet." },
      { status: 404 },
    );
  }

  let body: {
    email?: string;
    password?: string;
    displayName?: string;
    registrationCode?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const result = await remoteRegister({
    email: body.email ?? "",
    password: body.password ?? "",
    displayName: body.displayName,
    registrationCode: body.registrationCode,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({
    ok: true,
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
