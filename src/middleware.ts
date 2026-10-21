import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CONTROL_SESSION_COOKIE,
  getAuthApiUrl,
  getAuthSecret,
  isControlAuthEnabled,
} from "@/lib/auth/config";
import {
  isControlAuthProtectedPath,
  isControlAuthPublicPath,
} from "@/lib/auth/paths";
import { remoteCurrentUser } from "@/lib/auth/remote";
import { verifySessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  if (!isControlAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isControlAuthPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isControlAuthProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(CONTROL_SESSION_COOKIE)?.value;
  const ok = getAuthApiUrl()
    ? token !== undefined && (await remoteCurrentUser(token)) !== null
    : token !== undefined &&
      (await verifySessionToken(token, getAuthSecret()));

  if (ok) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/control/:path*", "/api/upload", "/api/upload/:path*"],
};
