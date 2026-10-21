import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  CONTROL_SESSION_COOKIE,
  getAuthApiUrl,
  getAuthSecret,
  isControlAuthEnabled,
} from "@/lib/auth/config";
import { remoteCurrentUser } from "@/lib/auth/remote";
import { verifySessionToken } from "@/lib/auth/session";

export async function GET() {
  if (getAuthApiUrl()) {
    const jar = await cookies();
    const token = jar.get(CONTROL_SESSION_COOKIE)?.value;
    const user = token ? await remoteCurrentUser(token) : null;
    return NextResponse.json({
      authEnabled: true,
      authenticated: user !== null,
      mode: "accounts",
      user,
    });
  }

  const enabled = isControlAuthEnabled();
  if (!enabled) {
    return NextResponse.json({
      authEnabled: false,
      authenticated: true,
      mode: "off",
    });
  }

  const jar = await cookies();
  const token = jar.get(CONTROL_SESSION_COOKIE)?.value;
  const authenticated =
    token !== undefined &&
    (await verifySessionToken(token, getAuthSecret()));

  return NextResponse.json({
    authEnabled: true,
    authenticated,
    mode: "password",
  });
}
